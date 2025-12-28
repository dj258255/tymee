#!/usr/bin/env ruby
# Live Activity Widget Extension 추가 스크립트

require 'xcodeproj'

# 프로젝트 열기
project_path = File.join(__dir__, 'mobile.xcodeproj')
project = Xcodeproj::Project.open(project_path)

# 이미 FocusTimerWidget 타겟이 있는지 확인
existing_target = project.targets.find { |t| t.name == 'FocusTimerWidget' }
if existing_target
  puts "FocusTimerWidget 타겟이 이미 존재합니다."
  exit 0
end

# 메인 타겟 찾기
main_target = project.targets.find { |t| t.name == 'mobile' }
unless main_target
  puts "Error: mobile 타겟을 찾을 수 없습니다."
  exit 1
end

# Bundle ID 가져오기
main_bundle_id = main_target.build_configurations.first.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] || 'com.tymee.mobile'
widget_bundle_id = "#{main_bundle_id}.FocusTimerWidget"

puts "메인 Bundle ID: #{main_bundle_id}"
puts "위젯 Bundle ID: #{widget_bundle_id}"

# Widget Extension 그룹 생성
widget_group = project.main_group.new_group('FocusTimerWidget', 'FocusTimerWidget')

# Swift 파일들 추가
swift_files = [
  'FocusTimerAttributes.swift',
  'FocusTimerWidgetBundle.swift',
  'FocusTimerLiveActivity.swift'
]

file_refs = []
swift_files.each do |filename|
  file_path = File.join(__dir__, 'FocusTimerWidget', filename)
  if File.exist?(file_path)
    ref = widget_group.new_file(file_path)
    file_refs << ref
    puts "파일 추가: #{filename}"
  else
    puts "Warning: #{filename} 파일을 찾을 수 없습니다."
  end
end

# Info.plist 추가
info_plist_path = File.join(__dir__, 'FocusTimerWidget', 'Info.plist')
if File.exist?(info_plist_path)
  widget_group.new_file(info_plist_path)
  puts "Info.plist 추가됨"
end

# Widget Extension 타겟 생성
widget_target = project.new_target(:app_extension, 'FocusTimerWidget', :ios, '16.1')

# 소스 파일 빌드 페이즈에 추가
file_refs.each do |ref|
  widget_target.source_build_phase.add_file_reference(ref)
end

# 빌드 설정
widget_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = widget_bundle_id
  config.build_settings['INFOPLIST_FILE'] = 'FocusTimerWidget/Info.plist'
  config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  config.build_settings['MARKETING_VERSION'] = '1.0'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.1'
  config.build_settings['SWIFT_EMIT_LOC_STRINGS'] = 'YES'
  config.build_settings['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
  config.build_settings['ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME'] = 'WidgetBackground'
  config.build_settings['SKIP_INSTALL'] = 'YES'
end

# 메인 앱에 Embed Extension 추가
embed_phase = main_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.dst_subfolder_spec = '13' # PlugIns 폴더
embed_phase.add_file_reference(widget_target.product_reference)

# 메인 앱에 Swift 파일들 추가 (LiveActivity 모듈)
main_group = project.main_group.groups.find { |g| g.name == 'mobile' }
if main_group
  # LiveActivityModule.swift
  swift_module_path = File.join(__dir__, 'mobile', 'LiveActivityModule.swift')
  if File.exist?(swift_module_path)
    ref = main_group.new_file(swift_module_path)
    main_target.source_build_phase.add_file_reference(ref)
    puts "LiveActivityModule.swift 추가됨"
  end

  # LiveActivityModule.m
  objc_module_path = File.join(__dir__, 'mobile', 'LiveActivityModule.m')
  if File.exist?(objc_module_path)
    ref = main_group.new_file(objc_module_path)
    main_target.source_build_phase.add_file_reference(ref)
    puts "LiveActivityModule.m 추가됨"
  end

  # FocusTimerAttributes.swift (공유)
  attrs_path = File.join(__dir__, 'mobile', 'FocusTimerAttributes.swift')
  if File.exist?(attrs_path)
    ref = main_group.new_file(attrs_path)
    main_target.source_build_phase.add_file_reference(ref)
    puts "FocusTimerAttributes.swift 추가됨"
  end

  # Bridging Header
  bridging_path = File.join(__dir__, 'mobile', 'mobile-Bridging-Header.h')
  if File.exist?(bridging_path)
    ref = main_group.new_file(bridging_path)
    puts "Bridging Header 추가됨"

    # Bridging Header 설정
    main_target.build_configurations.each do |config|
      config.build_settings['SWIFT_OBJC_BRIDGING_HEADER'] = '$(SRCROOT)/mobile/mobile-Bridging-Header.h'
    end
  end
end

# 타겟 의존성 추가
main_target.add_dependency(widget_target)

# 저장
project.save
puts "\n✅ Live Activity Widget Extension이 성공적으로 추가되었습니다!"
puts "Xcode에서 프로젝트를 열고 빌드해보세요."
