from decimal import Decimal

import pytest

from percontra import submissions
from percontra.adapters.destination.erpnext import COMPANY, ERPNextAdapter
from percontra.erpnext_smoke import prepare
from percontra.example import load_example


def test_gbp_fixture_is_separate_balanced_and_evidenced(tmp_path):
    service, batch = prepare(tmp_path / "smoke.duckdb")
    postings = service.approved(batch)
    assert len(postings) == 2
    assert {row.batch_key.legal_entity for row in postings} == {COMPANY}
    assert {row.destination.transaction_currency for row in postings} == {"GBP"}
    assert (
        sum(
            Decimal(row.destination.investor_amount_local.amount)
            * (1 if row.destination.is_debit else -1)
            for row in postings
        )
        == 0
    )
    assert all(
        row.source_refs[0].file_name == "synthetic-gbp-connectivity.json" for row in postings
    )
    assert (
        ERPNextAdapter(currency="GBP").validate(postings=postings, registries={"problems": []})
        == []
    )
    assert any(
        problem.code == "currency"
        for problem in ERPNextAdapter().validate(postings=postings, registries={"problems": []})
    )
    assert service.export(batch)[0].content


def test_gbp_test_does_not_disable_currency_checks():
    with pytest.raises(Exception, match="same-currency"):
        ERPNextAdapter(currency="JPY")


def test_original_run_retains_its_currency_after_switching_migrations(tmp_path):
    service, _ = prepare(tmp_path / "smoke.duckdb")
    original = service.context()[0]
    load_example(service)
    assert submissions.adapter(service).currency == "USD"
    assert submissions.adapter(service, original).currency == "GBP"
