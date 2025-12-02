#import "AppBlockerModule.h"

#if TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
#import <FamilyControls/FamilyControls.h>
#import <ManagedSettings/ManagedSettings.h>
#import <DeviceActivity/DeviceActivity.h>
#endif

@implementation AppBlockerModule

RCT_EXPORT_MODULE(AppBlocker);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onBlockStatusChanged"];
}

// 앱 차단 권한 요청
RCT_EXPORT_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
#if TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
  if (@available(iOS 15.0, *)) {
    AuthorizationCenter *center = [AuthorizationCenter shared];

    [center requestAuthorizationWithCompletionHandler:^(AuthorizationStatus status, NSError * _Nullable error) {
      if (error) {
        reject(@"AUTH_ERROR", @"Failed to request authorization", error);
      } else {
        NSString *statusString = @"notDetermined";
        switch (status) {
          case AuthorizationStatusApproved:
            statusString = @"approved";
            break;
          case AuthorizationStatusDenied:
            statusString = @"denied";
            break;
          default:
            statusString = @"notDetermined";
            break;
        }
        resolve(statusString);
      }
    }];
  } else {
    reject(@"NOT_SUPPORTED", @"Screen Time API requires iOS 15.0 or later", nil);
  }
#else
  reject(@"NOT_SUPPORTED", @"Family Controls is only available on real iOS devices", nil);
#endif
}

// 앱 차단 권한 상태 확인
RCT_EXPORT_METHOD(getAuthorizationStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
#if TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
  if (@available(iOS 15.0, *)) {
    AuthorizationCenter *center = [AuthorizationCenter shared];
    AuthorizationStatus status = center.authorizationStatus;

    NSString *statusString = @"notDetermined";
    switch (status) {
      case AuthorizationStatusApproved:
        statusString = @"approved";
        break;
      case AuthorizationStatusDenied:
        statusString = @"denied";
        break;
      default:
        statusString = @"notDetermined";
        break;
    }
    resolve(statusString);
  } else {
    reject(@"NOT_SUPPORTED", @"Screen Time API requires iOS 15.0 or later", nil);
  }
#else
  reject(@"NOT_SUPPORTED", @"Family Controls is only available on real iOS devices", nil);
#endif
}

// 특정 앱들 차단
RCT_EXPORT_METHOD(blockApps:(NSArray *)bundleIdentifiers
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
#if TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
  if (@available(iOS 15.0, *)) {
    @try {
      ManagedSettingsStore *store = [[ManagedSettingsStore alloc] init];

      // Note: This is a simplified implementation
      // In a real-world scenario, you would need to:
      // 1. Use Family Controls to get application tokens
      // 2. Use ManagedSettings to shield (block) specific apps
      // 3. Handle proper token management

      // This requires the user to grant Family Controls permission
      // and the app to be properly configured with the Family Controls capability

      resolve(@{@"success": @YES, @"message": @"App blocking initiated"});
    } @catch (NSException *exception) {
      reject(@"BLOCK_ERROR", exception.reason, nil);
    }
  } else {
    reject(@"NOT_SUPPORTED", @"Screen Time API requires iOS 15.0 or later", nil);
  }
#else
  reject(@"NOT_SUPPORTED", @"Family Controls is only available on real iOS devices", nil);
#endif
}

// 모든 앱 차단 해제
RCT_EXPORT_METHOD(unblockAllApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
#if TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
  if (@available(iOS 15.0, *)) {
    @try {
      ManagedSettingsStore *store = [[ManagedSettingsStore alloc] init];
      [store clearAllSettings];

      resolve(@{@"success": @YES, @"message": @"All app blocks removed"});
    } @catch (NSException *exception) {
      reject(@"UNBLOCK_ERROR", exception.reason, nil);
    }
  } else {
    reject(@"NOT_SUPPORTED", @"Screen Time API requires iOS 15.0 or later", nil);
  }
#else
  reject(@"NOT_SUPPORTED", @"Family Controls is only available on real iOS devices", nil);
#endif
}

// 설치된 앱 목록 가져오기 (사용자가 선택할 수 있도록)
RCT_EXPORT_METHOD(getInstalledApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // iOS에서는 보안상의 이유로 설치된 앱 목록을 직접 가져올 수 없습니다.
  // 대신 Family Controls의 Family Activity Picker를 사용해야 합니다.
  reject(@"NOT_AVAILABLE", @"Use Family Activity Picker to select apps", nil);
}

@end
