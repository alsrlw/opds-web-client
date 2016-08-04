import ActionsCreator from "../actions";
import DataFetcher from "../DataFetcher";
import { adapter } from "../OPDSDataAdapter";
import { CollectionData, BookData, BasicAuthCallback, BasicAuthLabels } from "../interfaces";
import { State } from "../state";

export function findBookInCollection(collection: CollectionData, book: string) {
  if (collection) {
    let allBooks = collection.lanes.reduce((books, lane) => {
      return books.concat(lane.books);
    }, collection.books);

    return allBooks.find(b => b.url === book || b.id === book);
  } else {
    return null;
  }
}

export function mapStateToProps(state, ownProps) {
  return {
    collectionData: state.collection.data || ownProps.collectionData,
    isFetching: state.collection.isFetching || state.book.isFetching,
    isFetchingPage: state.collection.isFetchingPage,
    error: (state.collection.error || state.book.error),
    bookData: state.book.data || ownProps.bookData,
    history: state.collection.history,
    loadedCollectionUrl: state.collection.url,
    loadedBookUrl: state.book.url,
    collectionUrl: ownProps.collectionUrl,
    bookUrl: ownProps.bookUrl,
    loansUrl: state.loans.url,
    loans: state.loans.books,
    basicAuth: state.auth.basic,
    isSignedIn: !!state.auth.basic.credentials
  };
};

export function mapDispatchToProps(dispatch) {
  return {
    createDispatchProps: (fetcher) => {
      let actions = new ActionsCreator(fetcher);
      return {
        fetchCollection: (url: string) => dispatch(actions.fetchCollection(url)),
        fetchPage: (url: string) => dispatch(actions.fetchPage(url)),
        fetchBook: (url: string) => dispatch(actions.fetchBook(url)),
        loadBook: (book: BookData, url: string) => dispatch(actions.loadBook(book, url)),
        clearCollection: () => dispatch(actions.clearCollection()),
        clearBook: () => dispatch(actions.clearBook()),
        fetchSearchDescription: (url: string) => dispatch(actions.fetchSearchDescription(url)),
        closeError: () => dispatch(actions.closeError()),
        borrowBook: (url: string) => dispatch(actions.borrowBook(url)),
        fulfillBook: (url: string) => dispatch(actions.fulfillBook(url)),
        fetchLoans: (url: string) => dispatch(actions.fetchLoans(url)),
        saveBasicAuthCredentials: (credentials: string) => dispatch(actions.saveBasicAuthCredentials(credentials)),
        clearBasicAuthCredentials: () => dispatch(actions.clearBasicAuthCredentials()),
        showBasicAuthForm: (callback: BasicAuthCallback, labels: BasicAuthLabels, title: string) => dispatch(actions.showBasicAuthForm(callback, labels, title)),
        closeErrorAndHideBasicAuthForm: () => dispatch(actions.closeErrorAndHideBasicAuthForm())
      };
    }
  };
};

// only used by a server when it needs to fetch collection and/or book data
// for a particular route into a store before it renders to HTML
export function createFetchCollectionAndBook(dispatch) {
  let fetcher = new DataFetcher({ adapter });
  let actions = mapDispatchToProps(dispatch).createDispatchProps(fetcher);
  let { fetchCollection, fetchBook } = actions;
  return (collectionUrl: string, bookUrl: string): Promise<{ collectionData: CollectionData, bookData: BookData }> => {
    return fetchCollectionAndBook({
      fetchCollection,
      fetchBook,
      collectionUrl,
      bookUrl
    });
  };
}

export function fetchCollectionAndBook({
  fetchCollection, fetchBook, collectionUrl, bookUrl
}): Promise<{ collectionData: CollectionData, bookData: BookData }> {
  return new Promise((resolve, reject) => {
    if (collectionUrl) {
      fetchCollection(collectionUrl).then(collectionData => {
        if (bookUrl) {
          fetchBook(bookUrl).then(bookData => {
            resolve({ collectionData, bookData });
          }).catch(err => reject(err));
        } else {
          resolve({ collectionData, bookData: null });
        }
      }).catch(err => reject(err));
    } else if (bookUrl) {
      fetchBook(bookUrl).then(bookData => {
        resolve({ collectionData: null, bookData });
      }).catch(err => reject(err));
    } else {
      resolve({ collectionData: null, bookData: null });
    }
  });
};

export function mergeRootProps(stateProps, createDispatchProps, componentProps) {
  let fetcher = new DataFetcher({
    proxyUrl: componentProps.proxyUrl,
    adapter: adapter
  });
  let dispatchProps = createDispatchProps.createDispatchProps(fetcher);

  let setCollection = (url: string) => {
    return new Promise((resolve, reject) => {
      if (url === stateProps.loadedCollectionUrl) {
        // if url is same, do nothing unless there's currently error
        if (stateProps.error) {
          dispatchProps.fetchCollection(url).then(data => resolve(data));
        } else {
          resolve(stateProps.collectionData);
        }
      } else {
        // if url is changed, either fetch or clear collection
        if (url) {
          dispatchProps.fetchCollection(url).then(data => resolve(data));
        } else {
          dispatchProps.clearCollection();
          resolve(null);
        }
      }
    });
  };

  let setBook = (book: BookData|string, collectionData: CollectionData = null) => {
    return new Promise((resolve, reject) => {
      let url = null;
      let bookData = null;

      if (typeof book === "string") {
        url = book;
        bookData = findBookInCollection(collectionData, url);
      } else if (book && typeof book === "object") {
        url = book.url;
        bookData = book;
      }

      if (bookData) {
        dispatchProps.loadBook(bookData, url);
        resolve(bookData);
      } else if (url) {
        dispatchProps.fetchBook(url).then(data => resolve(data));
      } else {
        dispatchProps.clearBook();
        resolve(null);
      }
    });
  };

  let setCollectionAndBook = (collectionUrl: string, bookUrl: string) => {
    return new Promise((resolve, reject) => {
      setCollection(collectionUrl).then((collectionData: CollectionData) => {
        setBook(bookUrl, collectionData).then((bookData: BookData) => {
          resolve({ collectionData, bookData });
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  };

  let { fetchCollection, fetchBook } = dispatchProps;

  let borrowBook = (url: string) => {
    return dispatchProps.borrowBook(url).then((data) => {
      if (stateProps.loansUrl) {
        dispatchProps.fetchLoans(stateProps.loansUrl);
      }

      return data;
    });
  };

  return Object.assign({}, componentProps, stateProps, dispatchProps, {
    setCollection: setCollection,
    setBook: setBook,
    setCollectionAndBook: setCollectionAndBook,
    refreshCollectionAndBook: () => {
      return fetchCollectionAndBook({
        fetchCollection,
        fetchBook,
        collectionUrl: stateProps.loadedCollectionUrl,
        bookUrl: stateProps.loadedBookUrl
      });
    },
    retryCollectionAndBook: () => {
      let { collectionUrl, bookUrl } = stateProps;
      return fetchCollectionAndBook({
        fetchCollection,
        fetchBook,
        collectionUrl,
        bookUrl
      });
    },
    clearCollection: () => {
      setCollection(null);
    },
    clearBook: () => {
      setBook(null);
    },
    borrowBook: borrowBook
  });
};