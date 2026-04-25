import { relations } from "drizzle-orm";
import { agents } from "./agents";
import { areas } from "./areas";
import { offices } from "./offices";
import { properties } from "./properties";

export const officesRelations = relations(offices, ({ many }) => ({
  properties: many(properties),
  agents: many(agents),
}));

export const propertiesRelations = relations(properties, ({ one }) => ({
  office: one(offices, { fields: [properties.officeId], references: [offices.id] }),
  area: one(areas, { fields: [properties.areaId], references: [areas.id] }),
  agent: one(agents, { fields: [properties.agentId], references: [agents.id] }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  office: one(offices, { fields: [agents.officeId], references: [offices.id] }),
  listings: many(properties),
}));

export const areasRelations = relations(areas, ({ many }) => ({
  properties: many(properties),
}));
