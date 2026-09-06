"""Generate the Python and TypeScript contract surfaces from JSON Schema."""

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def bundle():
    schemas = {
        name: json.loads((ROOT / "contracts" / f"{name}.schema.json").read_text())
        for name in ("posting", "decision", "adapter")
    }
    definitions = {}
    for schema in schemas.values():
        definitions.update(schema.get("$defs", {}))
    definitions["Posting"] = {
        k: v for k, v in schemas["posting"].items() if k not in ("$defs", "$id", "$schema", "title")
    }
    definitions["BatchKey"] = schemas["posting"]["properties"]["batch_key"]

    def rewrite(value):
        if isinstance(value, list):
            return [rewrite(item) for item in value]
        if not isinstance(value, dict):
            return value
        result = {key: rewrite(item) for key, item in value.items() if key != "description"}
        if "$ref" in result:
            ref = result["$ref"]
            result["$ref"] = (
                "#/$defs/BatchKey"
                if ref.endswith("#/properties/batch_key")
                else "#" + ref.split("#", 1)[1]
            )
        return result

    return {
        "type": "object",
        "title": "Contracts",
        "$defs": rewrite(definitions),
        "properties": {name: {"$ref": f"#/$defs/{name}"} for name in definitions},
    }


def typescript(schema):
    def shape(node):
        if "$ref" in node:
            return node["$ref"].rsplit("/", 1)[-1]
        if "const" in node:
            return json.dumps(node["const"])
        if "enum" in node:
            return " | ".join(json.dumps(value) for value in node["enum"])
        if "oneOf" in node:
            return " | ".join(shape(value) for value in node["oneOf"])
        kind = node.get("type")
        if isinstance(kind, list):
            return " | ".join(shape({**node, "type": value}) for value in kind)
        if kind == "object":
            if "properties" not in node:
                return "Record<string, " + shape(node.get("additionalProperties", {})) + ">"
            required = node.get("required", [])
            return (
                "{ "
                + "; ".join(
                    json.dumps(key) + ("" if key in required else "?") + ": " + shape(value)
                    for key, value in node["properties"].items()
                )
                + " }"
            )
        if kind == "array":
            return "Array<" + shape(node["items"]) + ">"
        return {
            "string": "string",
            "integer": "number",
            "number": "number",
            "boolean": "boolean",
            "null": "null",
        }.get(kind, "unknown")

    return (
        "// Generated from contracts/*.json.\n"
        + "\n".join(
            f"export type {name} = {shape(node)};" for name, node in schema["$defs"].items()
        )
        + "\n"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    schema = bundle()
    with tempfile.TemporaryDirectory(prefix="percontra-contracts-") as directory:
        source = Path(directory) / "contracts.json"
        output = Path(directory) / "models.py"
        source.write_text(json.dumps(schema))
        subprocess.run(
            [
                str(Path(sys.executable).with_name("datamodel-codegen")),
                "--input",
                str(source),
                "--input-file-type",
                "jsonschema",
                "--output",
                str(output),
                "--output-model-type",
                "pydantic_v2.BaseModel",
                "--use-standard-collections",
                "--use-union-operator",
                "--enum-field-as-literal",
                "all",
                "--use-annotated",
                "--disable-timestamp",
                "--target-python-version",
                "3.14",
            ],
            check=True,
        )
        artifacts = {
            ROOT / "api/percontra/contract/models.py": output.read_text(),
            # Emitted as generated, deliberately unformatted. oxfmt lists this
            # path in ignorePatterns, so piping it through `pnpm exec oxfmt`
            # returned the input byte for byte while making a Python-only CI job
            # depend on Node. The generator's output is the artifact.
            ROOT / "web/src/contract/migration.ts": typescript(schema),
        }
        for destination, content in artifacts.items():
            if args.check:
                if not destination.exists() or destination.read_text() != content:
                    raise SystemExit(f"Contract drift: {destination.relative_to(ROOT)}")
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_text(content)


if __name__ == "__main__":
    main()
