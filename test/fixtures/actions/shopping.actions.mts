// A synthetic action set shaped like Spoonjoy's shopping list: one action per consent class. Not Spoonjoy's code
// or data; Spoonjoy adopts the model in its own repositories.
import { defineAction, defineActions, field } from "../../../src/actions.mts";

export const getShoppingList = defineAction({
  id: "get_shopping_list",
  consent: "read",
  label: "Shopping list",
  description: "See what's on your shopping list.",
  agent: "Read the person's shopping list: each item's id, name, quantity, unit and whether it is checked.",
  input: {
    show: field.enum({ label: "Show", description: "Which items to list; all of them when left out.", values: ["all", "unchecked"], optional: true }),
  },
  output: {
    items: field.string({ label: "Items", description: "The list's items, as JSON.", returned: true }),
  },
  opensApp: true,
  cli: "list show",
});

export const addShoppingListItem = defineAction({
  id: "add_shopping_list_item",
  consent: "write",
  label: "Add to list",
  description: "Add an item to your shopping list.",
  agent: "Add one item to the person's shopping list. Give the name as the person said it; leave quantity and unit out when they gave none.",
  input: {
    name: field.string({ label: "Item", description: "What to buy, as the person said it, such as \"oat milk\".", arg: true, ask: "What should I add to your list?" }),
    quantity: field.number({ label: "Quantity", description: "How many or how much.", optional: true, min: 0 }),
    unit: field.string({ label: "Unit", description: "The unit of the quantity, such as g, cups or cans.", optional: true }),
    idempotencyKey: field.string({ label: "Idempotency key", description: "Send the same key again when retrying this exact call, and the item is added once.", optional: true, protocolOnly: true }),
  },
  output: {
    id: field.string({ label: "Item id", description: "The new item's id." }),
    name: field.string({ label: "Item", description: "The item's name as stored." }),
  },
  cli: "list add",
});

export const removeShoppingListItem = defineAction({
  id: "remove_shopping_list_item",
  consent: "write",
  label: "Remove",
  description: "Take an item off your shopping list.",
  agent: "Remove one item from the person's shopping list by its id. Removing an item that is already gone changes nothing.",
  input: {
    id: field.string({ label: "Item", description: "The item's id, from get_shopping_list.", arg: true }),
    alsoIds: field.list({
      label: "Other items",
      description: "More item ids to remove in the same call.",
      of: field.string({ label: "Item", description: "An item's id." }),
      optional: true,
      protocolOnly: true,
    }),
  },
  output: {},
  destructive: true,
  idempotent: true,
  cli: "list remove",
});

export const shareShoppingList = defineAction({
  id: "share_shopping_list",
  consent: "consequential",
  label: "Share list",
  description: "Share your shopping list with someone in your household.",
  agent: "Share the person's shopping list with another person, who can then see and change it.",
  input: {
    with: field.string({ label: "With", description: "The email address of the person to share with.", arg: true, entity: "HouseholdMemberEntity" }),
    canEdit: field.boolean({ label: "Can edit", description: "Whether they may change the list, not only see it.", optional: true }),
    message: field.string({ label: "Note", description: "A note to send with the invitation.", optional: true, multiline: true }),
  },
  output: {},
  cli: "list share",
});

export const placeGroceryOrder = defineAction({
  id: "place_grocery_order",
  consent: "person-only",
  label: "Place order",
  description: "Order everything on your list and pay for it.",
  agent: "Order the shopping list's items for delivery and pay for them.",
  input: {
    store: field.enum({ label: "Store", description: "Which store delivers.", values: ["corner", "market"] }),
  },
  output: {},
  personOnly: {
    reason: "You can't place an order or pay for the person; only they can.",
    how: "with Place order on the shopping list",
  },
  cli: "list order",
});

export default defineActions("shopping", [getShoppingList, addShoppingListItem, removeShoppingListItem, shareShoppingList, placeGroceryOrder], { tool: "shop" });
