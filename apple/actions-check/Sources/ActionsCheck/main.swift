// Checks the shopping fixture's generated Swift: every door calls the one handler, the person-only action has no
// App Intent and refuses with the typed refusal, and Reins' actions come from the same declarations.
import AppIntents
import Foundation
import OuroReins

public struct HouseholdMemberEntity: AppEntity {
    public static let typeDisplayRepresentation: TypeDisplayRepresentation = "Household member"
    public static let defaultQuery = HouseholdMemberQuery()
    public let id: String
    public init(id: String) { self.id = id }
    public var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(id)") }
}

public struct HouseholdMemberQuery: EntityQuery {
    public init() {}
    public func entities(for identifiers: [String]) async throws -> [HouseholdMemberEntity] { identifiers.map(HouseholdMemberEntity.init(id:)) }
}

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

    // A protocol-only field (the idempotency key) is on the input but never on the person's doors: the intent leaves it nil.
    let keyed = AddShoppingListItemIntent(AddShoppingListItemInput(name: "salt", idempotencyKey: "retry-1"))
    expect(keyed.input == AddShoppingListItemInput(name: "salt"), "the App Intent drops a protocol-only field")

    // The intent always speaks: the app's dialog hears the input and the result, success or failure.
    var heard: [String] = []
    AddShoppingListItemAction.dialog = { input, result in
        switch result {
        case .success: heard.append("added \(input.name)")
        case .failure: heard.append("failed \(input.name)")
        }
        return IntentDialog(stringLiteral: "Added \(input.name).")
    }
    _ = try await keyed.perform()
    expect(heard == ["added salt"], "the dialog hears the handler's result")
    calls.removeLast()

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

    // The intent options: an entity parameter (the string id in Input), a returned value, openAppWhenRun.
    let share = ShareShoppingListIntent(ShareShoppingListInput(with: "sam@example.com", canEdit: true))
    expect(share.with.id == "sam@example.com", "the intent's entity parameter is built from the Input's string")
    expect(share.input == ShareShoppingListInput(with: "sam@example.com", canEdit: true), "the entity goes back to its id in Input")
    GetShoppingListAction.perform = { _ in GetShoppingListOutput(items: "[]") }
    _ = try await GetShoppingListIntent().perform()
    expect(GetShoppingListIntent.openAppWhenRun, "opensApp is openAppWhenRun")
    expect(!AddShoppingListItemIntent.openAppWhenRun, "an action that doesn't ask doesn't open the app")

    // A consequential intent asks through a hook, so a test can confirm or cancel it; unset, the system asks.
    var shared: [ShareShoppingListInput] = []
    ShareShoppingListAction.perform = { input in shared.append(input); return ShareShoppingListOutput() }
    struct Declined: Error {}
    var asked: [ShareShoppingListInput] = []
    ShareShoppingListAction.confirm = { input in asked.append(input) }
    _ = try await share.perform()
    expect(asked == [share.input] && shared == [share.input], "a confirmed consequential intent asks with its input, then runs the handler")
    ShareShoppingListAction.confirm = { input in asked.append(input); throw Declined() }
    do {
        _ = try await share.perform()
        expect(false, "a cancelled consequential intent ran")
    } catch is Declined {
        expect(asked.count == 2 && shared.count == 1, "a cancelled consequential intent asks, then never runs the handler")
    }
    ShareShoppingListAction.confirm = nil
    expect(ShareShoppingListAction.confirm == nil, "the hook is unset by default, so the system's own confirmation asks")

    if failures.isEmpty {
        print("ok    generated Swift: one handler behind the intent, the button and Reins; person-only refuses")
    } else {
        for failure in failures { print("FAIL  \(failure)") }
        exit(1)
    }
}

try await check()
