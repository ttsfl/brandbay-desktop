!macro customInstall
  ; Add custom installation steps for Windows here if needed
  WriteRegStr HKCU "Software\BrandBay" "InstallDir" "$INSTDIR"
!macroend

!macro customUnInstall
  ; Add custom uninstallation steps for Windows here if needed
  DeleteRegKey HKCU "Software\BrandBay"
!macroend
