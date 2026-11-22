// A synthetic action set shaped like Spoonjoy's shopping list: one action per consent class. Not Spoonjoy's code
// or data; Spoonjoy adopts the model in its own repositories.
import { defineAction, defineActions, field } from "../../../src/actions.mts";

export const getShoppingList = defineAction({
  id: "get_shopping_list",
  consent: "read",
  label: "Shopping list",
  description: "See what's on your shopping list.",
  agent: "Read the person's shopping list: each item's id, name, quantity, unit and whether it is checked.",
  when: "Pick this to see what is on the person's list, and to find an item's id before you remove it.",
  errors: [{ code: "no-list", means: "The person has no shopping list yet.", fix: "Add an item with add_shopping_list_item, which starts the list." }],
  input: {
    show: field.enum({ label: "Show", description: "Which items to list; all of them when left out.", values: ["all", "unchecked"], optional: true }),
    sort: field.enum({ label: "Sort", description: "How to order the items.", values: ["added", "name"], optional: true, arg: true, default: "added" }),
    store: field.string({ label: "Store", description: "Only the items for this store, by its name; every store when left out.", optional: true, arg: true }),
    limit: field.number({ label: "Limit", description: "The most items to list.", optional: true, min: 1, max: 100, default: 50 }),
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
  when: "Pick this to put one new thing the person asked for on their list; to take one off, use remove_shopping_list_item.",
  errors: [{ code: "name-too-long", means: "The item's name is over 200 characters.", fix: "Send the item's name alone, and put any detail in quantity and unit." }],
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
  when: "Pick this to take an item off the list once get_shopping_list has given you its id.",
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
  when: "Pick this only when the person asked to share their list with someone by email.",
  errors: [{ code: "not-in-household", means: "No one in the person's household has that email address.", fix: "Ask the person for the email address of someone in their household." }],
  confirm: "Share your list with this person? They will be able to see it and change it.",
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

/** The Windows projection's options (src/actions-windows.mts): the package's URI scheme and MCP server. */
export const windows = { scheme: "ouro-shop", server: "OuroShop.Mcp", version: "1.0.0" };

/** The Android projection's options (src/actions-android.mts): the Kotlin package of OuroActions.kt. */
export const android = { package: "bot.ouro.shop.actions" };

/** The in-turn tools projection's options (src/actions-tools.mts): the Ouro AX group its cards belong to. */
export const tools = { group: "turn-shopping" };
