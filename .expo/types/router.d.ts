/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/account` | `/account`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/cards` | `/cards`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/crypto` | `/crypto`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/account` | `/account`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/cards` | `/cards`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/crypto` | `/crypto`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/account${`?${string}` | `#${string}` | ''}` | `/account${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/cards${`?${string}` | `#${string}` | ''}` | `/cards${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/crypto${`?${string}` | `#${string}` | ''}` | `/crypto${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/account` | `/account`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/cards` | `/cards`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/crypto` | `/crypto`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; };
    }
  }
}
