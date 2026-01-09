import Foundation
import React

#if !targetEnvironment(simulator)
import FamilyControls
import ManagedSettings
import DeviceActivity
#endif

@objc(AppBlockerSwift)
class AppBlockerSwift: RCTEventEmitter {

  #if !targetEnvironment(simulator)
  private let store = ManagedSettingsStore()
  #endif

  override init() {
    super.init()
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onBlockStatusChanged", "onAuthorizationStatusChanged"]
  }

  // MARK: - Authorization

  @objc(requestAuthorization:rejecter:)
  func requestAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    #if targetEnvironment(simulator)
    reject("NOT_SUPPORTED", "Family Controls is only available on real iOS devices", nil)
    #else
    if #available(iOS 16.0, *) {
      Task {
        do {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
          let status = AuthorizationCenter.shared.authorizationStatus
          resolve(self.statusToString(status))
        } catch {
          reject("AUTH_ERROR", "Failed to request authorization: \(error.localizedDescription)", error)
        }
      }
    } else {
      reject("NOT_SUPPORTED", "Screen Time API requires iOS 16.0 or later", nil)
    }
    #endif
  }

  @objc(getAuthorizationStatus:rejecter:)
  func getAuthorizationStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    #if targetEnvironment(simulator)
    reject("NOT_SUPPORTED", "Family Controls is only available on real iOS devices", nil)
    #else
    if #available(iOS 16.0, *) {
      let status = AuthorizationCenter.shared.authorizationStatus
      resolve(statusToString(status))
    } else {
      reject("NOT_SUPPORTED", "Screen Time API requires iOS 16.0 or later", nil)
    }
    #endif
  }

  // MARK: - App Blocking

  @objc(blockAllApps:rejecter:)
  func blockAllApps(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    #if targetEnvironment(simulator)
    reject("NOT_SUPPORTED", "Family Controls is only available on real iOS devices", nil)
    #else
    if #available(iOS 16.0, *) {
      // Block all apps except system apps
      store.shield.applicationCategories = .all()
      resolve(["success": true, "message": "All apps blocked"])
    } else {
      reject("NOT_SUPPORTED", "Screen Time API requires iOS 16.0 or later", nil)
    }
    #endif
  }

  @objc(unblockAllApps:rejecter:)
  func unblockAllApps(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    #if targetEnvironment(simulator)
    reject("NOT_SUPPORTED", "Family Controls is only available on real iOS devices", nil)
    #else
    if #available(iOS 16.0, *) {
      store.shield.applicationCategories = nil
      store.shield.applications = nil
      store.shield.webDomainCategories = nil
      store.shield.webDomains = nil
      resolve(["success": true, "message": "All apps unblocked"])
    } else {
      reject("NOT_SUPPORTED", "Screen Time API requires iOS 16.0 or later", nil)
    }
    #endif
  }

  @objc(clearAllSettings:rejecter:)
  func clearAllSettings(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    #if targetEnvironment(simulator)
    reject("NOT_SUPPORTED", "Family Controls is only available on real iOS devices", nil)
    #else
    if #available(iOS 16.0, *) {
      store.clearAllSettings()
      resolve(["success": true, "message": "All settings cleared"])
    } else {
      reject("NOT_SUPPORTED", "Screen Time API requires iOS 16.0 or later", nil)
    }
    #endif
  }

  // MARK: - Helper Methods

  #if !targetEnvironment(simulator)
  @available(iOS 16.0, *)
  private func statusToString(_ status: AuthorizationStatus) -> String {
    switch status {
    case .approved:
      return "approved"
    case .denied:
      return "denied"
    case .notDetermined:
      return "notDetermined"
    @unknown default:
      return "unknown"
    }
  }
  #endif
}
