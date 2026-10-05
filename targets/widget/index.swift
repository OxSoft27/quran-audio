import WidgetKit
import SwiftUI

// MARK: - Timeline Entry
struct QuranWidgetEntry: TimelineEntry {
    let date: Date
    let surahName: String
    let surahNumber: Int
    let qariName: String
    let isPlaying: Bool
    let dailyTitle: String
    let dailyArabic: String
    let dailyTranslation: String
    let dailySurahName: String
    let dailySurahNumber: Int
    let dailyAyahNumber: Int
    let dailyAudioUrl: String
    let dailyCategory: String
    let nextPrayerName: String?
    let nextPrayerTime: String?

    var deepLinkUrl: URL? {
        let encodedAudio = dailyAudioUrl.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let encodedSurah = dailySurahName.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "quranflow://play?surah=\(dailySurahNumber)&ayah=\(dailyAyahNumber)&audioUrl=\(encodedAudio)&surahName=\(encodedSurah)")
    }
}

// MARK: - Timeline Provider
struct QuranWidgetProvider: TimelineProvider {
    private let appGroupSuite = "group.com.lunaris.quranflow"

    private var sharedDefaults: UserDefaults {
        return UserDefaults(suiteName: appGroupSuite) ?? UserDefaults.standard
    }

    func placeholder(in context: Context) -> QuranWidgetEntry {
        QuranWidgetEntry(
            date: Date(),
            surahName: "At-Talaq",
            surahNumber: 65,
            qariName: "Mishary Al-Afasy",
            isPlaying: false,
            dailyTitle: "Jalan Keluar & Rezeki",
            dailyArabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
            dailyTranslation: "Barangsiapa bertakwa kepada Allah niscaya Dia akan mengadakan baginya jalan keluar dan memberinya rezeki dari arah tak terduga.",
            dailySurahName: "At-Talaq",
            dailySurahNumber: 65,
            dailyAyahNumber: 2,
            dailyAudioUrl: "https://everyayah.com/data/Alafasy_128kbps/065002.mp3",
            dailyCategory: "rezeki",
            nextPrayerName: "Subuh",
            nextPrayerTime: "04:24"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (QuranWidgetEntry) -> Void) {
        completion(currentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuranWidgetEntry>) -> Void) {
        let entry = currentEntry()
        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func currentEntry() -> QuranWidgetEntry {
        let defaults = sharedDefaults

        // Check if stored via individual keys
        let dailyTitle = defaults.string(forKey: "widget_dailyTitle") ?? "Penyejuk Hati Hari Ini"
        let dailyArabic = defaults.string(forKey: "widget_dailyArabic") ?? "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
        let dailyTranslation = defaults.string(forKey: "widget_dailyTranslation") ?? "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram."
        let dailySurahName = defaults.string(forKey: "widget_dailySurahName") ?? "Ar-Ra'd"
        let dailySurahNumber = defaults.integer(forKey: "widget_dailySurahNumber") != 0 ? defaults.integer(forKey: "widget_dailySurahNumber") : 13
        let dailyAyahNumber = defaults.integer(forKey: "widget_dailyAyahNumber") != 0 ? defaults.integer(forKey: "widget_dailyAyahNumber") : 28
        let dailyAudioUrl = defaults.string(forKey: "widget_dailyAudioUrl") ?? "https://everyayah.com/data/Alafasy_128kbps/013028.mp3"
        let dailyCategory = defaults.string(forKey: "widget_dailyCategory") ?? "kecemasan"

        let surahName = defaults.string(forKey: "widget_surahName") ?? dailySurahName
        let surahNumber = defaults.integer(forKey: "widget_surahNumber") != 0 ? defaults.integer(forKey: "widget_surahNumber") : dailySurahNumber
        let qariName = defaults.string(forKey: "widget_qariName") ?? "Mishary Al-Afasy"
        let isPlaying = defaults.bool(forKey: "widget_isPlaying")

        return QuranWidgetEntry(
            date: Date(),
            surahName: surahName,
            surahNumber: surahNumber,
            qariName: qariName,
            isPlaying: isPlaying,
            dailyTitle: dailyTitle,
            dailyArabic: dailyArabic,
            dailyTranslation: dailyTranslation,
            dailySurahName: dailySurahName,
            dailySurahNumber: dailySurahNumber,
            dailyAyahNumber: dailyAyahNumber,
            dailyAudioUrl: dailyAudioUrl,
            dailyCategory: dailyCategory,
            nextPrayerName: defaults.string(forKey: "widget_nextPrayerName"),
            nextPrayerTime: defaults.string(forKey: "widget_nextPrayerTime")
        )
    }
}

// MARK: - Widget Views
struct QuranWidgetEntryView: View {
    var entry: QuranWidgetProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Group {
            switch family {
            case .systemSmall:
                SmallWidgetView(entry: entry)
            case .systemMedium:
                MediumWidgetView(entry: entry)
            case .accessoryRectangular:
                AccessoryRectangularView(entry: entry)
            default:
                SmallWidgetView(entry: entry)
            }
        }
        .widgetURL(entry.deepLinkUrl)
    }
}

// MARK: - System Small View
struct SmallWidgetView: View {
    var entry: QuranWidgetEntry

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.05, green: 0.07, blue: 0.07), Color(red: 0.08, green: 0.14, blue: 0.13)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 5) {
                // Top Header
                HStack {
                    HStack(spacing: 3) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 9, weight: .bold))
                        Text("AYAT HARI INI")
                            .font(.system(size: 8, weight: .bold))
                    }
                    .foregroundColor(Color(red: 0.06, green: 0.72, blue: 0.65))

                    Spacer()

                    Image(systemName: "play.circle.fill")
                        .font(.system(size: 15))
                        .foregroundColor(Color(red: 0.06, green: 0.72, blue: 0.65))
                }

                Spacer(minLength: 2)

                // Arabic Text
                Text(entry.dailyArabic)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: .infinity, alignment: .trailing)

                Spacer(minLength: 2)

                // Surah & Ayah Reference
                Text("QS. \(entry.dailySurahName): \(entry.dailyAyahNumber)")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Color(red: 0.11, green: 0.85, blue: 0.76))

                // Translation preview
                Text(entry.dailyTranslation)
                    .font(.system(size: 9))
                    .foregroundColor(Color(white: 0.75))
                    .lineLimit(1)
            }
            .padding(12)
        }
    }
}

// MARK: - System Medium View
struct MediumWidgetView: View {
    var entry: QuranWidgetEntry

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.05, green: 0.07, blue: 0.07), Color(red: 0.08, green: 0.14, blue: 0.13)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            HStack(spacing: 12) {
                // Left Column: Reflection & Translation
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "book.fill")
                            .font(.system(size: 10))
                        Text(entry.dailyTitle)
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundColor(Color(red: 0.06, green: 0.72, blue: 0.65))

                    Text(entry.dailyTranslation)
                        .font(.system(size: 11))
                        .foregroundColor(Color(white: 0.88))
                        .lineLimit(3)
                        .lineSpacing(2)

                    Spacer()

                    HStack(spacing: 6) {
                        Text("QS. \(entry.dailySurahName): \(entry.dailyAyahNumber)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(red: 0.11, green: 0.85, blue: 0.76))

                        Spacer()

                        HStack(spacing: 4) {
                            Image(systemName: "play.fill")
                                .font(.system(size: 9))
                            Text("Dengar")
                                .font(.system(size: 10, weight: .semibold))
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(red: 0.06, green: 0.72, blue: 0.65).opacity(0.2))
                        .foregroundColor(Color(red: 0.11, green: 0.85, blue: 0.76))
                        .cornerRadius(8)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Right Column: Arabic Calligraphy Accent
                VStack(alignment: .trailing, spacing: 4) {
                    Text(entry.dailyArabic)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.white)
                        .lineLimit(3)
                        .multilineTextAlignment(.trailing)
                        .lineSpacing(4)

                    Spacer()
                }
                .frame(width: 120, alignment: .trailing)
            }
            .padding(14)
        }
    }
}

// MARK: - Lock Screen Accessory View
struct AccessoryRectangularView: View {
    var entry: QuranWidgetEntry

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "play.circle.fill")
                .font(.system(size: 14))

            VStack(alignment: .leading, spacing: 1) {
                Text("QS. \(entry.dailySurahName): \(entry.dailyAyahNumber)")
                    .font(.system(size: 12, weight: .bold))
                    .lineLimit(1)

                Text(entry.dailyTitle)
                    .font(.system(size: 10))
                    .opacity(0.85)
                    .lineLimit(1)
            }
        }
    }
}

// MARK: - Widget Bundle & Main
@main
struct QuranAudioWidget: Widget {
    let kind: String = "QuranAudioWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuranWidgetProvider()) { entry in
            QuranWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Quran Audio")
        .description("Ayat penyejuk hati & murottal langsung di Layar Utama dan Layar Kunci.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}
