export type RootStackParamList = {
  Home: undefined;
  Test: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
