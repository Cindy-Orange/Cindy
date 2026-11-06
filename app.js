(() => {
  "use strict";

  const FIELDS = [
    "id",
    "English",
    "Chinese",
    "English_Nominal",
    "Chinese_Verb",
  ];
  const corpus = window.NVATLAS_CORPUS;

  const form = document.querySelector("#search-form");
  const input = document.querySelector("#corpus-search");
  const clearButton = document.querySelector("#clear-search");
  const emptyClearButton = document.querySelector("#empty-clear");
  const results = document.querySelector("#entry-results");
  const resultCount = document.querySelector("#result-count");
  const resultLabel = document.querySelector("#result-label");
  const searchStatus = document.querySelector("#search-status");
  const activeQuery = document.querySelector("#active-query");
  const loadingState = document.querySelector("#loading-state");
  const errorState = document.querySelector("#error-state");
  const emptyState = document.querySelector("#empty-state");

  const normalize = (value) =>
    String(value ?? "")
      .normalize("NFKC")
      .toLocaleLowerCase();

  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const showError = () => {
    loadingState.hidden = true;
    results.hidden = true;
    emptyState.hidden = true;
    errorState.hidden = false;
    resultCount.textContent = "0";
    resultLabel.textContent = "entries unavailable";
    searchStatus.textContent = "The corpus could not be loaded.";
  };

  if (!Array.isArray(corpus)) {
    showError();
    return;
  }

  const records = corpus.map((record, index) => {
    const valid =
      record &&
      FIELDS.every(
        (field) => typeof record[field] === "string" && record[field].length > 0,
      );

    return {
      ...record,
      index,
      searchable: valid
        ? normalize(FIELDS.map((field) => record[field]).join(" "))
        : "",
      valid,
    };
  });

  const validRecords = records.filter((record) => record.valid);

  const createEntryCard = (record) => {
    const card = makeElement("article", "entry-card");
    card.setAttribute("aria-label", `Corpus entry ${record.id}`);

    const top = makeElement("div", "entry-top");
    top.append(
      makeElement("span", "entry-id", `#${record.id}`),
      makeElement(
        "span",
        "entry-position",
        String(record.index + 1).padStart(3, "0"),
      ),
    );

    const englishBlock = makeElement("div", "language-block");
    englishBlock.lang = "en";
    englishBlock.append(
      makeElement("p", "language-label", "English"),
      makeElement("blockquote", "", record.English),
    );

    const chineseBlock = makeElement("div", "language-block");
    chineseBlock.lang = "zh-Hans";
    chineseBlock.append(
      makeElement("p", "language-label", "中文"),
      makeElement("blockquote", "", record.Chinese),
    );

    const terms = makeElement("dl", "term-pair");
    const nominal = makeElement("div");
    nominal.append(
      makeElement("dt", "", "English nominal"),
      makeElement("dd", "", record.English_Nominal),
    );
    const verb = makeElement("div");
    verb.append(
      makeElement("dt", "", "Chinese verb"),
      makeElement("dd", "chinese-term", record.Chinese_Verb),
    );
    terms.append(nominal, verb);

    card.append(top, englishBlock, chineseBlock, terms);
    return card;
  };

  const render = (query) => {
    const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
    const matches = tokens.length
      ? validRecords.filter((record) =>
          tokens.every((token) => record.searchable.includes(token)),
        )
      : validRecords;

    const fragment = document.createDocumentFragment();
    matches.forEach((record) => fragment.append(createEntryCard(record)));
    results.replaceChildren(fragment);

    const hasQuery = query.trim().length > 0;
    results.hidden = matches.length === 0;
    emptyState.hidden = matches.length !== 0;
    clearButton.hidden = !hasQuery;
    activeQuery.hidden = !hasQuery;
    activeQuery.textContent = hasQuery ? `Query: “${query.trim()}”` : "";

    resultCount.textContent = String(matches.length);
    resultLabel.textContent =
      matches.length === 1 ? "entry available" : "entries available";

    if (hasQuery) {
      searchStatus.textContent =
        matches.length === 0
          ? "No corpus entries matched your search."
          : `Showing ${matches.length} of ${validRecords.length} entries for “${query.trim()}”.`;
    } else {
      searchStatus.textContent = `Showing all ${validRecords.length} entries.`;
    }
  };

  const clearSearch = () => {
    input.value = "";
    render("");
    input.focus();
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render(input.value);
  });

  input.addEventListener("input", () => render(input.value));
  clearButton.addEventListener("click", clearSearch);
  emptyClearButton.addEventListener("click", clearSearch);

  loadingState.hidden = true;
  errorState.hidden = true;

  if (validRecords.length !== corpus.length) {
    console.warn("Some corpus entries were incomplete and have been omitted.");
  }

  const initialQuery = new URLSearchParams(window.location.search).get("q") ?? "";
  input.value = initialQuery;
  render(initialQuery);
})();
