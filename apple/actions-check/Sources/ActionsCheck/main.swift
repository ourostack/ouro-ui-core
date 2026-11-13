// Checks the shopping fixture's generated Swift: every door calls the one handler, the person-only action has no
// App Intent and refuses with the typed refusal, and Reins' actions come from the same declarations.
import AppIntents
import Foundation
import OuroReins

@MainActor
func check() async throws {
    var failures: [String] = []
    func expect(_ ok: Bool, _ what: String) { if !ok { failures.append(what) } }

    // Before the app binds a handler, every door says so instead of doing nothing.
    do {
        _ = try await AddShoppingListItemAction.run(AddShoppingListItemInput(name: "oat milk"))
        expect(false, "an unbound action ran")
    } catch let error as OuroActionNotBound {
        expect(error.action == "add_shopping_list_item", "the not-bound error names the action")
    }

    // The button's intent and Reins call the same handler.
    var calls: [AddShoppingListItemInput] = []
    AddShoppingListItemAction.perform = { input in
        calls.append(input)
        return AddShoppingListItemOutput(id: "item-1", name: input.name)
    }
    let intent = AddShoppingListItemIntent(AddShoppingListItemInput(name: "flour", quantity: 500, unit: "g"))
    _ = try await intent.perform()
    expect(calls == [AddShoppingListItemInput(name: "flour", quantity: 500, unit: "g")], "the App Intent calls the handler with its input")
    expect(AddShoppingListItemIntent.title == "Add to list", "the intent's title is the person's label")

    let reins = ReinsAction.addShoppingListItem()
    expect(reins.name == "addShoppingListItem" && reins.title == "Add to list", "Reins names the action from the declaration")
    expect(
        reins.input == .object(properties: ["name": .string, "quantity": .number, "unit": .string], required: ["name"]),
        "Reins' input schema comes from the declaration"
    )
    let session = ReinsSession(root: { ReinsNode("list", actions: [.addShoppingListItem()]) })
    let reply = await session.perform("addShoppingListItem", input: .object(["name": .string("eggs")]))
    expect(reply.ok && calls.count == 2 && calls.last?.name == "eggs", "a Reins action runs the same handler")
    expect(ReinsAction.getShoppingList().input == .object(properties: ["show": .oneOf(["all", "unchecked"])], required: []), "an optional enum is a oneOf, not required")

    // The person-only action: no intent, a typed refusal for any bridge that asks, still in Reins as the person's finger.
    let refusal = OuroActions.refusal(for: "place_grocery_order")
    expect(refusal?.code == "person-only" && refusal?.thing == "list order", "place_grocery_order refuses with person-only")
    expect(refusal?.exit == 2 && refusal?.message == "list order: \(refusal?.problem ?? "")." , "the refusal carries web's exit and message")
    expect(OuroActions.refusal(for: "placeGroceryOrder") == refusal, "the refusal answers to the camel name too")
    expect(OuroActions.refusal(for: "add_shopping_list_item") == nil, "an agent action has no refusal")
    expect(OuroActions.consent["share_shopping_list"] == .consequential, "the consent class is carried")
    expect(ReinsAction.placeGroceryOrder().name == "placeGroceryOrder", "Reins keeps the person-only action")

    if failures.isEmpty {
        print("ok    generated Swift: one handler behind the intent, the button and Reins; person-only refuses")
    } else {
        for failure in failures { print("FAIL  \(failure)") }
        exit(1)
    }
}

try await check()
