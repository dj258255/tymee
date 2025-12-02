require 'xcodeproj'

project_path = 'mobile.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first

# Get the mobile group
mobile_group = project.main_group['mobile']

# Add AppBlockerModule files to the project
app_blocker_h = mobile_group.new_file('mobile/AppBlockerModule.h')
app_blocker_m = mobile_group.new_file('mobile/AppBlockerModule.m')

# Add .m file to compile sources
target.source_build_phase.add_file_reference(app_blocker_m)

# Add .h file to headers (if needed)
# target.headers_build_phase.add_file_reference(app_blocker_h)

# Set Code Signing Entitlements
target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'mobile/mobile.entitlements'
end

# Add frameworks
frameworks_group = project.frameworks_group
family_controls = frameworks_group.new_file('System/Library/Frameworks/FamilyControls.framework')
managed_settings = frameworks_group.new_file('System/Library/Frameworks/ManagedSettings.framework')
device_activity = frameworks_group.new_file('System/Library/Frameworks/DeviceActivity.framework')

target.frameworks_build_phase.add_file_reference(family_controls)
target.frameworks_build_phase.add_file_reference(managed_settings)
target.frameworks_build_phase.add_file_reference(device_activity)

# Save the project
project.save

puts "✅ AppBlockerModule files added to Xcode project"
puts "✅ Entitlements file configured"
puts "✅ Frameworks added (FamilyControls, ManagedSettings, DeviceActivity)"
puts ""
puts "⚠️  You still need to manually add Family Controls capability in Xcode:"
puts "   1. Open mobile.xcworkspace in Xcode"
puts "   2. Select mobile project"
puts "   3. Select mobile target"
puts "   4. Go to 'Signing & Capabilities' tab"
puts "   5. Click '+ Capability'"
puts "   6. Add 'Family Controls'"
