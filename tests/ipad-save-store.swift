import Foundation

@main struct SaveStoreTests {
    static func main() throws {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: folder) }
        let store = try SaveStore(directory: folder)
        let key = "splash-line-park-v1"
        let first = [key: "{\"version\":2,\"name\":\"First\",\"rides\":[],\"tickets\":42}"]
        let second = [key: "{\"version\":2,\"name\":\"Second\",\"rides\":[],\"tickets\":99}"]
        let empty = try store.load(); precondition(empty.isEmpty)
        try store.save(first); try store.save(second); try store.save(second) // Duplicate flush retains first backup.
        let restored = try SaveStore(directory: folder).load(); precondition(restored == second)
        try Data("corrupt".utf8).write(to: folder.appendingPathComponent("parks.json"))
        let recovered = try store.load(); precondition(recovered == first && store.recovered)
        try store.save(second)
        let backup = try Data(contentsOf: folder.appendingPathComponent("parks-backup.json"))
        let backupValues = try JSONDecoder().decode([String:String].self,from:backup); precondition(backupValues == first)
        do { try store.save([key:"broken"]); fatalError("Invalid save accepted") } catch {}
        let afterFailure = try store.load(); precondition(afterFailure == second)
        for name in ["parks.json","parks-backup.json"] { try Data("corrupt".utf8).write(to:folder.appendingPathComponent(name)) }
        do { _ = try store.load(); fatalError("Corruption was silently reset") } catch {}
        print("PASS: durable round trip, backup recovery, corrupt-primary preservation, invalid-save rejection, and fail-closed startup.")
    }
}
