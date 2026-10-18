import Foundation

/// Independent of WebKit storage, preserved across app updates and eligible for device backup.
final class SaveStore {
    let directory: URL
    private(set) var recovered = false
    private let key = "splash-line-park-v1"
    init(directory: URL) throws {
        self.directory = directory
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }
    private var primary: URL { directory.appendingPathComponent("parks.json") }
    private var backup: URL { directory.appendingPathComponent("parks-backup.json") }
    private func decode(_ data: Data) throws -> [String: String] {
        let values = try JSONDecoder().decode([String: String].self, from: data)
        guard values[key] != nil, values.keys.allSatisfy({ $0 == key || $0 == key + "-backup" || $0 == key + "-previous-park" }) else {
            throw NSError(domain: "Sketchwater", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unrecognized save archive"])
        }
        for raw in values.values {
            guard let bytes = raw.data(using: .utf8), let park = try JSONSerialization.jsonObject(with: bytes) as? [String: Any],
                  park["rides"] is [Any], (park["version"] as? Int ?? 1) <= 2 else {
                throw NSError(domain: "Sketchwater", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid park save"])
            }
        }
        return values
    }
    func load() throws -> [String: String] {
        var failure: Error?
        for url in [primary, backup] where FileManager.default.fileExists(atPath: url.path) {
            do {
                let values = try decode(Data(contentsOf: url))
                recovered = url == backup
                return values
            } catch { failure = error }
        }
        if let failure = failure { throw failure } // Never silently turn an unreadable park into a new park.
        return [:]
    }
    func save(_ values: [String: String]) throws {
        let encoder = JSONEncoder(); encoder.outputFormatting = .sortedKeys
        let bytes = try encoder.encode(values)
        _ = try decode(bytes)
        if let previous = try? Data(contentsOf: primary), (try? decode(previous)) != nil {
            if previous == bytes { return } // Duplicate lifecycle flushes must not consume the backup.
            try previous.write(to: backup, options: .atomic)
        }
        try bytes.write(to: primary, options: .atomic)
        guard try Data(contentsOf: primary) == bytes else { throw CocoaError(.fileWriteUnknown) }
    }
}
