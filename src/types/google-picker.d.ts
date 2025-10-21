declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: {
          apiKey: string;
          discoveryDocs: string[];
        }) => Promise<void>;
        getToken: () => { access_token: string } | null;
        setToken: (token: { access_token: string }) => void;
      };
      auth2: {
        getAuthInstance: () => {
          signIn: (options?: { scope: string }) => Promise<{
            getAuthResponse: () => { access_token: string };
          }>;
          isSignedIn: {
            get: () => boolean;
          };
          currentUser: {
            get: () => {
              getAuthResponse: () => { access_token: string };
            };
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        ViewId: {
          DOCS: string;
          DOCS_IMAGES: string;
        };
        DocsViewMode: {
          GRID: string;
          LIST: string;
        };
        Feature: {
          MULTISELECT_ENABLED: string;
          NAV_HIDDEN: string;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
      };
    };
  }

  interface GooglePickerBuilder {
    addView(view: string | GooglePickerView): GooglePickerBuilder;
    setOAuthToken(token: string): GooglePickerBuilder;
    setDeveloperKey(key: string): GooglePickerBuilder;
    setCallback(callback: (data: GooglePickerResponse) => void): GooglePickerBuilder;
    setOrigin(origin: string): GooglePickerBuilder;
    enableFeature(feature: string): GooglePickerBuilder;
    setTitle(title: string): GooglePickerBuilder;
    build(): GooglePicker;
  }

  interface GooglePicker {
    setVisible(visible: boolean): void;
  }

  interface GooglePickerView {
    setMimeTypes(mimeTypes: string): GooglePickerView;
  }

  interface GooglePickerResponse {
    action: string;
    docs?: Array<{
      id: string;
      name: string;
      mimeType: string;
      thumbnailUrl?: string;
      url: string;
    }>;
  }
}

export {};
