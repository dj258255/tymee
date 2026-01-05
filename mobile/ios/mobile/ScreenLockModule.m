#import "ScreenLockModule.h"
#import <UIKit/UIKit.h>

@implementation ScreenLockModule

RCT_EXPORT_MODULE(ScreenLockModule);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

// 화면 잠금 (밝기를 0으로 낮춤)
RCT_EXPORT_METHOD(lockScreen:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      // 현재 밝기 저장
      CGFloat currentBrightness = [UIScreen mainScreen].brightness;
      [[NSUserDefaults standardUserDefaults] setFloat:currentBrightness forKey:@"savedBrightness"];
      [[NSUserDefaults standardUserDefaults] synchronize];

      // 밝기를 최소로 낮춤
      [UIScreen mainScreen].brightness = 0.0;

      resolve(@YES);
    } @catch (NSException *exception) {
      reject(@"LOCK_ERROR", exception.reason, nil);
    }
  });
}

// 화면 잠금 해제 (밝기 복원)
RCT_EXPORT_METHOD(unlockScreen:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      // 저장된 밝기 복원
      CGFloat savedBrightness = [[NSUserDefaults standardUserDefaults] floatForKey:@"savedBrightness"];
      if (savedBrightness <= 0) {
        savedBrightness = 0.5; // 기본값
      }
      [UIScreen mainScreen].brightness = savedBrightness;

      resolve(@YES);
    } @catch (NSException *exception) {
      reject(@"UNLOCK_ERROR", exception.reason, nil);
    }
  });
}

// 현재 화면 잠금 상태 확인
RCT_EXPORT_METHOD(isLocked:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      CGFloat brightness = [UIScreen mainScreen].brightness;
      resolve(@(brightness <= 0.01));
    } @catch (NSException *exception) {
      reject(@"CHECK_ERROR", exception.reason, nil);
    }
  });
}

@end
