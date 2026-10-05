import Foundation
import ExpoModulesCore
import WidgetKit

public class WidgetBridgeModule: Module {
  private let appGroupSuite = "group.com.lunaris.quranflow"

  private var sharedDefaults: UserDefaults {
    return UserDefaults(suiteName: appGroupSuite) ?? UserDefaults.standard
  }

  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    Function("setWidgetData") { (data: [String: Any]) in
      let defaults = self.sharedDefaults

      if let surahName = data["surahName"] as? String {
        defaults.set(surahName, forKey: "widget_surahName")
      }
      if let surahNumber = data["surahNumber"] as? Int {
        defaults.set(surahNumber, forKey: "widget_surahNumber")
      }
      if let qariName = data["qariName"] as? String {
        defaults.set(qariName, forKey: "widget_qariName")
      }
      if let isPlaying = data["isPlaying"] as? Bool {
        defaults.set(isPlaying, forKey: "widget_isPlaying")
      }
      if let ayahArabic = data["ayahArabic"] as? String {
        defaults.set(ayahArabic, forKey: "widget_ayahArabic")
      }
      if let ayahTranslation = data["ayahTranslation"] as? String {
        defaults.set(ayahTranslation, forKey: "widget_ayahTranslation")
      }
      if let nextPrayerName = data["nextPrayerName"] as? String {
        defaults.set(nextPrayerName, forKey: "widget_nextPrayerName")
      }
      if let nextPrayerTime = data["nextPrayerTime"] as? String {
        defaults.set(nextPrayerTime, forKey: "widget_nextPrayerTime")
      }

      // Daily Verse Recommendation
      if let dailyTitle = data["dailyTitle"] as? String {
        defaults.set(dailyTitle, forKey: "widget_dailyTitle")
      }
      if let dailyArabic = data["dailyArabic"] as? String {
        defaults.set(dailyArabic, forKey: "widget_dailyArabic")
      }
      if let dailyTranslation = data["dailyTranslation"] as? String {
        defaults.set(dailyTranslation, forKey: "widget_dailyTranslation")
      }
      if let dailySurahName = data["dailySurahName"] as? String {
        defaults.set(dailySurahName, forKey: "widget_dailySurahName")
      }
      if let dailySurahNumber = data["dailySurahNumber"] as? Int {
        defaults.set(dailySurahNumber, forKey: "widget_dailySurahNumber")
      }
      if let dailyAyahNumber = data["dailyAyahNumber"] as? Int {
        defaults.set(dailyAyahNumber, forKey: "widget_dailyAyahNumber")
      }
      if let dailyAudioUrl = data["dailyAudioUrl"] as? String {
        defaults.set(dailyAudioUrl, forKey: "widget_dailyAudioUrl")
      }
      if let dailyCategory = data["dailyCategory"] as? String {
        defaults.set(dailyCategory, forKey: "widget_dailyCategory")
      }

      defaults.set(Date().timeIntervalSince1970, forKey: "widget_lastUpdated")
      defaults.synchronize()

      #if canImport(WidgetKit)
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
      #endif

      return true
    }

    Function("getWidgetData") { () -> [String: Any] in
      let defaults = self.sharedDefaults
      var result: [String: Any] = [:]

      result["surahName"] = defaults.string(forKey: "widget_surahName") ?? "Al-Fatihah"
      result["surahNumber"] = defaults.integer(forKey: "widget_surahNumber") != 0 ? defaults.integer(forKey: "widget_surahNumber") : 1
      result["qariName"] = defaults.string(forKey: "widget_qariName") ?? "Mishary Al-Afasy"
      result["isPlaying"] = defaults.bool(forKey: "widget_isPlaying")
      result["ayahArabic"] = defaults.string(forKey: "widget_ayahArabic") ?? "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ"
      result["ayahTranslation"] = defaults.string(forKey: "widget_ayahTranslation") ?? "Maka nikmat Tuhanmu yang manakah yang kamu dustakan?"
      result["nextPrayerName"] = defaults.string(forKey: "widget_nextPrayerName")
      result["nextPrayerTime"] = defaults.string(forKey: "widget_nextPrayerTime")

      // Daily Verse
      result["dailyTitle"] = defaults.string(forKey: "widget_dailyTitle") ?? "Jalan Keluar & Rezeki"
      result["dailyArabic"] = defaults.string(forKey: "widget_dailyArabic") ?? "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا"
      result["dailyTranslation"] = defaults.string(forKey: "widget_dailyTranslation") ?? "Barangsiapa bertakwa kepada Allah niscaya Dia akan mengadakan baginya jalan keluar."
      result["dailySurahName"] = defaults.string(forKey: "widget_dailySurahName") ?? "At-Talaq"
      result["dailySurahNumber"] = defaults.integer(forKey: "widget_dailySurahNumber") != 0 ? defaults.integer(forKey: "widget_dailySurahNumber") : 65
      result["dailyAyahNumber"] = defaults.integer(forKey: "widget_dailyAyahNumber") != 0 ? defaults.integer(forKey: "widget_dailyAyahNumber") : 2
      result["dailyAudioUrl"] = defaults.string(forKey: "widget_dailyAudioUrl") ?? "https://everyayah.com/data/Alafasy_128kbps/065002.mp3"
      result["dailyCategory"] = defaults.string(forKey: "widget_dailyCategory") ?? "rezeki"

      return result
    }

    Function("reloadAllWidgets") {
      #if canImport(WidgetKit)
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
      #endif
      return true
    }
  }
}
