"""Thin client for the NCBI E-utilities API (no API key required for light use)."""

from __future__ import annotations

import xml.etree.ElementTree as ET

import httpx

EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
USER_AGENT = "ClinicalRAG/1.0 (portfolio project; contact via github.com/Eddiegah)"


def search_pmids(query: str, retmax: int, client: httpx.Client) -> list[str]:
    response = client.get(
        f"{EUTILS_BASE}/esearch.fcgi",
        params={
            "db": "pubmed",
            "term": query,
            "retmax": retmax,
            "sort": "relevance",
            "retmode": "json",
        },
        headers={"User-Agent": USER_AGENT},
    )
    response.raise_for_status()
    return response.json().get("esearchresult", {}).get("idlist", [])


def fetch_abstracts(pmids: list[str], client: httpx.Client) -> list[dict]:
    if not pmids:
        return []
    response = client.get(
        f"{EUTILS_BASE}/efetch.fcgi",
        params={"db": "pubmed", "id": ",".join(pmids), "rettype": "abstract", "retmode": "xml"},
        headers={"User-Agent": USER_AGENT},
    )
    response.raise_for_status()
    return _parse_articles(response.text)


def _parse_articles(xml_text: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    articles = []
    for article in root.findall(".//PubmedArticle"):
        pmid_el = article.find(".//PMID")
        title_el = article.find(".//ArticleTitle")
        abstract_parts = article.findall(".//Abstract/AbstractText")
        journal_el = article.find(".//Journal/Title")
        year_el = article.find(".//PubDate/Year")

        if pmid_el is None or title_el is None or not abstract_parts:
            continue

        abstract_text = " ".join(
            (part.text or "").strip() for part in abstract_parts if part.text
        ).strip()
        if not abstract_text:
            continue

        articles.append(
            {
                "pmid": pmid_el.text,
                "title": (title_el.text or "").strip(),
                "abstract": abstract_text,
                "journal": (journal_el.text or "").strip() if journal_el is not None else "",
                "year": (year_el.text or "").strip() if year_el is not None else "",
            }
        )
    return articles
