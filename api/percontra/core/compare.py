from collections import Counter


def compare(actual, expected):
    generated = Counter(tuple(row) for row in actual)
    reference = Counter(tuple(row) for row in expected)
    return {
        "matched": sum((generated & reference).values()),
        "missing": sum((reference - generated).values()),
        "unexpected": sum((generated - reference).values()),
        "expected": sum(reference.values()),
    }
