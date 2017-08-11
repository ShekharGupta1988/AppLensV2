# AppLensV2

### Building SourceCode
AppLensV2 requires that you create a config file that has secrets to talk to SupportObserver and GeoRegionService.

To do that, create a file name AppLensV2Settings.config in the same directory as the csproj file. Use the [AppLensV2Settings_Template.config](https://github.com/ShekharGupta1988/AppLensV2/blob/master/AppLensV2/AppLensV2Settings_Template.config) file as a start. 

Provide values for geoRegionAuthCertThumbprint and clientSecret. Refer to DiagnosticRole OneNote for information regarding how to get the clientSecret

Add Kusto Nuget packages. In Visual Studio go to Tools > Nuget Package Manager > Package Manager Settings > Package Sources. Add a new source https://mseng.pkgs.visualstudio.com/_packaging/Kusto/nuget/v3/index.json
