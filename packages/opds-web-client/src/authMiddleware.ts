import DataFetcher from "./DataFetcher";
import AuthPlugin from "./AuthPlugin";
import ActionCreator from "./actions";
import { AuthCallback, AuthProvider, AuthMethod, PathFor } from "./interfaces";

// see Redux Middleware docs:
// http://redux.js.org/docs/advanced/Middleware.html

export default (authPlugins: AuthPlugin[], pathFor: PathFor) => {
  return store => next => action => {
    let fetcher = new DataFetcher();
    let actions = new ActionCreator(fetcher);

    if (typeof action === "function") {
      return new Promise((resolve, reject) => {
        next(actions.hideAuthForm());
        let result = next(action);

        if (result && result.then) {
          result.then(resolve).catch(err => {
            if (err.status === 401) {
              let error;
              let data;

              // response might not be JSON
              try {
                data = JSON.parse(err.response);
              } catch (e) {
                reject(err);
                return;
              }

              if (err.headers && err.headers["www-authenticate"]) {
                // browser's default basic auth form was shown,
                // so don't show ours
                reject(err);
              } else {
                // clear any invalid credentials
                let existingAuth = !!fetcher.getAuthCredentials();
                if (existingAuth) {
                  // 401s resulting from wrong username/password return
                  // problem detail documents, not auth documents
                  error = data.title;
                  store.dispatch(actions.clearAuthCredentials());
                }

                // find providers with supported auth method
                let authProviders: AuthProvider<AuthMethod>[] = [];
                authPlugins.forEach(plugin => {
                  let providerKey = data.providers && Object.keys(data.providers).find(key => {
                    return Object.keys(data.providers[key].methods).indexOf(plugin.type) !== -1;
                  });
                  if (providerKey) {
                    let provider = data.providers[providerKey];
                    let method = provider.methods[plugin.type];
                    authProviders.push({ name: provider.name, plugin, method });
                  }
                });

                if (
                  existingAuth ||
                  authProviders.length
                ) {
                  let callback: AuthCallback = () => {
                    // use dispatch() instead of next() to start from the top
                    store.dispatch(action).then(() => {;
                      resolve();
                    }).catch((err) => {
                      reject(err);
                    });
                  };

                  // if the collection and book urls in the state don't match
                  // the current url, we're on a page that requires authentication
                  // and cancel should go back to the previous page. otherwise,
                  // it should just close the form.
                  let oldCollectionUrl = store.getState().collection.url;
                  let oldBookUrl = store.getState().book.url;
                  let currentUrl = window.location.pathname;
                  let cancel;
                  if (pathFor(oldCollectionUrl, oldBookUrl) === currentUrl) {
                    cancel = () => {
                      next(actions.hideAuthForm());
                    };
                  } else {
                    cancel = () => {
                      history.back();
                    };
                  }

                  let title;

                  // if previous auth failed, we have to get providers
                  // from store, instead of response data
                  if (existingAuth) {
                    let state = store.getState();
                    title = state.auth.title;
                    authProviders = state.auth.providers;
                  } else {
                    title = data.name;
                  }

                  // if previous auth failed and we didn't have any providers
                  // in the store, we need to start the request again from the top
                  // (with cleared credentials) to get the opds authentication document.
                  if (existingAuth && authProviders === null) {
                    store.dispatch(action);
                    resolve();
                  } else {
                    next(actions.closeError());
                    next(actions.showAuthForm(
                      callback,
                      cancel,
                      authProviders,
                      title,
                      error
                    ));
                  }
                } else {
                  // no provider found with basic auth method
                  // currently this custom response will not make it to the user,
                  // becuase the fetch error has already been dispatched by
                  // fetchCollectionFailure, fetchBookFailure, etc
                  next(actions.hideAuthForm());
                  reject({
                    status: 401,
                    response: "Authentication is required but no compatible authentication method was found.",
                    url: err.url
                  });
                }
              }
            } else {
              next(actions.hideAuthForm());
              reject(err);
            }
          });
        }
      }).catch(err => {
        // this is where we could potentially dispatch a custom auth error action
        // displaying a more informative error
      });
    }

    next(actions.hideAuthForm());
    next(action);
  };
};