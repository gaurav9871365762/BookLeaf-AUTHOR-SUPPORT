export const KNOWLEDGE_BASE = {
  "Royalty & Payments": [
    "The author royalty split is 80% of net profit to the author and 20% to BookLeaf. Net profit is MRP minus printing cost, platform commission, and shipping.",
    "Royalties are calculated quarterly and paid within 45 days after quarter end. A minimum balance of ₹1,000 is required; lower balances roll forward. Payouts go to the linked bank account."
  ],
  "ISBN & Metadata Issues": [
    "BookLeaf assigns ISBNs under its imprint. ISBN errors are high priority and should be routed to the production team.",
    "Metadata changes usually appear on platforms within 3–5 business days."
  ],
  "Printing & Quality": [
    "Standard print turnaround is 5–7 business days from order confirmation.",
    "Verified print defects may qualify for a free reprint and may require photos for review."
  ],
  "Distribution & Availability": [
    "New listings usually go live 7–10 business days after publication.",
    "A stock re-sync may take 24–48 hours."
  ],
  "Book Status & Production Updates": [
    "Production stages are Manuscript Received, Editing (if opted), Cover Design, Typesetting, Proofreading, ISBN Assignment, Printing, Distribution Setup, and Published & Live."
  ],
  "General Inquiry": [
    "Use the author's account and book information to identify the next step. Do not promise an action, outcome, or date that is not confirmed in the ticket data."
  ]
} as const;

export function getKnowledgeForTicket(category: string, query: string): string[] {
  const categoryFacts = KNOWLEDGE_BASE[category as keyof typeof KNOWLEDGE_BASE] ?? [];
  const queryText = query.toLowerCase();
  const additionalFacts = Object.entries(KNOWLEDGE_BASE)
    .filter(([key]) => key !== category)
    .filter(([key, facts]) => queryText.includes(key.split(" ")[0].toLowerCase()) ||
      facts.some((fact) => {
        const keywords = ["payout", "royalt", "isbn", "metadata", "print", "quality", "listing", "stock"];
        return keywords.some((keyword) => queryText.includes(keyword) && fact.toLowerCase().includes(keyword));
      }))
    .flatMap(([, facts]) => facts);

  return [...new Set([...categoryFacts, ...additionalFacts])].slice(0, 4);
}
