// UI section grants, not business-role enums or server authorization.
export const sections = ['consumer', 'agent', 'institutional', 'administration'] as const;
export type AppSection = (typeof sections)[number];

export type SessionView = {
  source: 'design-fixture' | 'server';
  subject: string;
  sectionGrants: readonly AppSection[];
};

export function canAccessSection(session: SessionView | null, section: AppSection) {
  return session?.sectionGrants.includes(section) ?? false;
}
// Server integration must derive grants from current tenant/org roles + auth strength.
// An institutional grant never implies combined police/registry/insurer permissions.

