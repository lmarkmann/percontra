from percontra.contract import Capabilities

from .destination.erpnext import ERPNextAdapter
from .destination.xlsx_phase1_loader import Phase1Adapter
from .source.csv_generic import CSVAdapter
from .source.xlsx_investor_gl import InvestorGLAdapter


class UnverifiedAdapter:
    capabilities = Capabilities(**{key: "unverified" for key in Capabilities.model_fields})

    def __init__(self, name):
        self.name = name

    def registries(self, *, handle):
        raise NotImplementedError(f"{self.name} has no verified integration")

    def validate(self, *, postings, registries):
        raise NotImplementedError(f"{self.name} has no verified integration")

    def render(self, *, postings):
        raise NotImplementedError(f"{self.name} has no verified integration")

    def submit(self, *, artifact):
        raise NotImplementedError(f"{self.name} has no verified integration")


ADAPTERS = {
    adapter.name: adapter
    for adapter in (InvestorGLAdapter, CSVAdapter, Phase1Adapter, ERPNextAdapter)
}


def create(name, **configuration):
    if name in ("entrilia", "intacct", "investran"):
        return UnverifiedAdapter(name)
    if name not in ADAPTERS:
        raise ValueError("Unknown adapter: " + name)
    return ADAPTERS[name](**configuration)


def catalog():

    rows = [
        {
            "name": adapter.name,
            "implemented": True,
            "capabilities": adapter.capabilities.model_dump(mode="json"),
        }
        for adapter in ADAPTERS.values()
    ]
    rows.extend(
        {
            "name": name,
            "implemented": False,
            "capabilities": UnverifiedAdapter.capabilities.model_dump(mode="json"),
        }
        for name in ("entrilia", "intacct", "investran")
    )
    return rows
