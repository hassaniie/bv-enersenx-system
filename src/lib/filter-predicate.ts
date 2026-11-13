// Compiles a ReUI `filters` query tree to a row predicate, for select-type fields.
// Adapted from c-filters-7: the "is" family plus empty checks; groups are honoured,
// and an unfinished rule (no value yet) matches everything.

import { isFilterRule } from "@/components/reui/filters/filters-query"
import type { FilterNode, FilterRule } from "@/components/reui/filters/filters-types"

function isIncomplete(rule: FilterRule) {
  if (rule.operator === "empty" || rule.operator === "not_empty") return false
  return rule.value === undefined || (Array.isArray(rule.value) && rule.value.length === 0)
}

function matchesRule<T>(row: T, rule: FilterRule, read: (row: T, path: string) => unknown): boolean {
  const raw = read(row, rule.path[0])
  const actual = String(raw)
  const value = rule.value
  const result = (() => {
    switch (rule.operator) {
      case "is":
        return actual === String(value)
      case "is_not":
        return actual !== String(value)
      case "is_any_of":
        return (value as string[]).includes(actual)
      case "is_none_of":
        return !(value as string[]).includes(actual)
      case "empty":
        return raw === undefined || raw === null || raw === ""
      case "not_empty":
        return !(raw === undefined || raw === null || raw === "")
      default:
        return true
    }
  })()
  return rule.negated ? !result : result
}

export function matchesQuery<T>(
  row: T,
  node: FilterNode,
  read: (row: T, path: string) => unknown = (r, p) => (r as Record<string, unknown>)[p]
): boolean {
  if (isFilterRule(node)) return isIncomplete(node) ? true : matchesRule(row, node, read)
  if (node.rules.length === 0) return true
  return node.combinator === "and"
    ? node.rules.every((child) => matchesQuery(row, child, read))
    : node.rules.some((child) => matchesQuery(row, child, read))
}
