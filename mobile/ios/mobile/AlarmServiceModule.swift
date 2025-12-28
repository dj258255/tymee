//
//  AlarmServiceModule.swift
//  mobile
//
//  iOS System Sound를 사용한 알람 서비스 모듈
//

import Foundation
import AudioToolbox
import AVFoundation

@objc(AlarmServiceModule)
class AlarmServiceModule: NSObject {

  // iOS 시스템 사운드 ID 매핑
  // 참고: https://iphonedev.wiki/index.php/AudioServices
  private let soundMap: [String: SystemSoundID] = [
    "default": 1007,    // SMS Received - Tri-tone (기본 알림음)
    "bell": 1013,       // SMS Received - Bell
    "chime": 1008,      // SMS Received - Chime
    "digital": 1016,    // SMS Received - Electronic
    "gentle": 1003,     // SMS Received - Note (부드러운 알림)
    "alarm": 1005,      // Alarm sound
    "tweet": 1016,      // Tweet sent
    "none": 0           // 무음
  ]

  private var audioPlayer: AVAudioPlayer?

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func playAlarm(_ soundType: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else {
        resolve(false)
        return
      }

      // 무음인 경우
      if soundType == "none" {
        resolve(true)
        return
      }

      // 시스템 사운드 재생
      if let soundID = self.soundMap[soundType] {
        // 사운드와 진동 함께 재생
        AudioServicesPlayAlertSound(soundID)
        resolve(true)
      } else {
        // 기본 사운드로 폴백
        AudioServicesPlayAlertSound(1007)
        resolve(true)
      }
    }
  }

  @objc
  func previewSound(_ soundType: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else {
        resolve(false)
        return
      }

      // 무음인 경우 짧은 진동
      if soundType == "none" {
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        resolve(true)
        return
      }

      // 시스템 사운드만 재생 (진동 없이)
      if let soundID = self.soundMap[soundType] {
        AudioServicesPlaySystemSound(soundID)
        resolve(true)
      } else {
        AudioServicesPlaySystemSound(1007)
        resolve(true)
      }
    }
  }

  @objc
  func stopAlarm(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      self?.audioPlayer?.stop()
      self?.audioPlayer = nil
      resolve(true)
    }
  }

  @objc
  func isSupported(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(true)
  }
}
