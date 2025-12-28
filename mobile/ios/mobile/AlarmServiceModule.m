//
//  AlarmServiceModule.m
//  mobile
//
//  React Native 브릿지 for AlarmServiceModule
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AlarmServiceModule, NSObject)

RCT_EXTERN_METHOD(playAlarm:(NSString *)soundType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(previewSound:(NSString *)soundType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopAlarm:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isSupported:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
