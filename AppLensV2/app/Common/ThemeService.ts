///<reference path="../references.ts" />

module SupportCenter {
    "use strict";

    export interface IThemeService {
        getTheme(): string;
    }

    export class ThemeService implements IThemeService {

        public static $inject: string[] = ["$state"];

        constructor(private $state: angular.ui.IStateService) { }


        getTheme(): string {
            if (this.$state.current.name.indexOf('appServiceEnvironment') >= 0) {
                return 'default3';
            }
            else {
                let currentStateName = this.$state.current.name;

                if (currentStateName.indexOf('perfanalysis') > 0) {
                    return 'default2';
                }
                else if (currentStateName.indexOf('apprestartanalysis') > 0) {
                    return 'default4';
                }
                else {
                    return 'default';
                }
            }
        }
    }
}