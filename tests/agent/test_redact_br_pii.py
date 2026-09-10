"""[custom/henri-desktop] BR PII mask — formatted CPF/CNPJ must never reach the model.

Regression guard for the local privacy customization: formatted CPF/CNPJ in any
redacted surface (file reads, terminal output, subagent summaries) is masked to
a sentinel that keeps only the final 2 check digits, so the "nome + final do
CPF" lookup workflow keeps working while the identifying digits never leave the
machine. Raw digit runs are deliberately NOT masked (WhatsApp JIDs and phone
numbers are 10-13 digit runs; masking those breaks the XP batch flow).
"""

from agent.redact import redact_sensitive_text


def _masked_cpf(text: str) -> str:
    return redact_sensitive_text(text, force=True)


def test_formatted_cpf_masked_keeps_last_two_digits():
    out = _masked_cpf("Cliente: João da Silva | CPF 123.456.789-00 | conta 12345")
    assert "123.456.789-00" not in out
    assert "***.***.***-00" in out
    assert "João da Silva" in out  # names are policy-allowed; digits are not


def test_formatted_cnpj_masked_keeps_last_two_digits():
    out = _masked_cpf("XP Investimentos CCTVM S.A. 61.722.435/0001-10")
    assert "61.722.435/0001-10" not in out
    assert "**.***.***/****-10" in out


def test_multiple_cpfs_in_one_dump():
    row_dump = "123.456.789-00;987.654.321-88;111.222.333-44"
    out = _masked_cpf(row_dump)
    assert out.count("***.***.***-") == 3
    assert "987.654.321" not in out


def test_raw_digit_run_not_masked():
    # WhatsApp JID / phone numbers must survive (XP batch depends on them)
    jid = "SIP: 5511999999999@s.whatsapp.net msgid 3EB0AAAAAAAA"
    out = _masked_cpf(jid)
    assert "5511999999999" in out


def test_cpf_embedded_in_longer_digit_run_ignored():
    # lookbehind/lookahead: only standalone formatted CPFs match
    out = _masked_cpf("ref 1123.456.789-001 fim")
    assert "123.456.789-00" in out  # untouched — part of a longer run


def test_file_read_path_masks_cpf():
    out = redact_sensitive_text(
        "linha1: Maria | 987.654.321-88 | R$ 10.000,00", force=True, file_read=True
    )
    assert "987.654.321-88" not in out
    assert "***.***.***-88" in out


def test_version_string_not_mangled():
    out = _masked_cpf("hermes-agent v2026.9.7 build 1.2.3-04")
    assert "2026.9.7" in out
    assert "1.2.3-04" in out
