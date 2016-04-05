interface BaseProps extends __React.HTMLProps<any> {
  pathFor?: (collectionUrl: string, bookUrl: string) => string;
}

interface CollectionActionProps {
  navigate?: (collectionUrl: string, book: BookData|string, isTopLevel?: boolean) => Promise<any>;
  fetchPage?: (url: string) => void;
  isTopLevel?: boolean;
}

interface BookActionProps {
  navigate?: (collectionUrl: string, book: BookData|string, isTopLevel?: boolean) => Promise<any>;
  clearBook?: () => void;
  book?: BookData;
  collectionUrl?: string;
}

interface BookData {
  id: string;
  title: string;
  authors?: string[];
  contributors?: string[];
  summary?: string;
  imageUrl?: string;
  url?: string;
  publisher?: string;
  published?: string;
  categories?: string[];
}

interface BookProps extends BookActionProps, BaseProps {
  book: BookData;
}

interface BookDetailsContainerProps extends BaseProps {
  bookUrl: string;
  collectionUrl: string;
  refreshBrowser: () => void;
}

interface LaneData {
  title: string;
  url: string;
  books: BookData[];
}

interface LaneProps extends CollectionActionProps, BookActionProps, BaseProps {
  lane: LaneData;
}

interface FacetData {
  label: string;
  href: string;
  active: boolean;
}

interface FacetProps extends CollectionActionProps, BaseProps {
  facet: FacetData;
}

interface FacetGroupData {
  label: string;
  facets: FacetData[];
}

interface FacetGroupProps extends CollectionActionProps, BaseProps {
  facetGroup: FacetGroupData;
}

interface SearchProps extends CollectionActionProps, BaseProps {
  url?: string;
  searchData?: {
    description: string;
    shortName: string;
    template: (searchTerms: string) => string;
  };
  fetchSearchDescription?: (url: string) => void;
}

interface CollectionData {
  id: string;
  url: string;
  title: string;
  lanes: LaneData[];
  books: BookData[];
  links: LinkData[];
  facetGroups?: FacetGroupData[];
  search?: SearchProps;
  nextPageUrl?: string;
  catalogRootUrl?: string;
}

interface CollectionProps extends CollectionActionProps, BookActionProps, BaseProps {
  collection: CollectionData;
  isFetching?: boolean;
  isFetchingPage?: boolean;
  error?: FetchError;
  fetchSearchDescription?: (url: string) => void;
  history?: LinkData[];
}

// these properties need to be optional because they're used by RootProps,
// which doesn't implement them until Root is connected to the state by redux;
// initially, Root isn't provided most of these props
interface State {
  collectionData?: CollectionData;
  collectionUrl?: string;
  isFetching?: boolean;
  error?: FetchError;
  bookData?: BookData;
  bookUrl?: string;
  isFetchingPage?: boolean;
  history?: LinkData[];
}

interface HeaderProps extends BaseProps {
  renderCollectionLink: (text: string, url: string) => JSX.Element;
}

interface RootProps extends State, CollectionActionProps, BaseProps {
  store?: Redux.Store;
  collectionUrl?: string;
  bookUrl?: string;
  proxyUrl?: string;
  BookDetailsContainer?: new() =>  __React.Component<BookDetailsContainerProps, any>;
  dispatch?: any;
  setCollectionAndBook?: (collectionUrl: string, bookUrl: string, isToplevel?: boolean) => void;
  clearCollection?: () => void;
  clearBook?: () => void;
  fetchSearchDescription?: (url: string) => void;
  closeError?: () => void;
  fetchBook?: (bookUrl: string) => Promise<any>;
  refreshCollectionAndBook?: () => void;
  pageTitleTemplate?: (collectionTitle: string, bookTitle: string) => string;
  headerTitle?: string;
  header?: new () => __React.Component<HeaderProps, any>;
}

interface UrlFormProps extends CollectionActionProps, BaseProps {
  url?: string;
}

interface LinkData {
  id: string;
  text: string;
  url: string;
}

interface LinkProps extends BaseProps {
  text?: string; // optional because link can have child elements instead of text
  url: string;
}

interface CollectionLinkProps extends LinkProps, CollectionActionProps, BaseProps {
}

interface BookPreviewLinkProps extends LinkProps, BookActionProps, BaseProps {
  book?: BookData;
}

interface ErrorMessageProps {
  message: string;
  retry?: () => void;
}

interface FetchError {
  status: number;
  response: string;
  url: string;
}

interface BreadcrumbsProps extends BaseProps, CollectionActionProps {
  history: LinkData[];
  collection: CollectionData;
  showCurrentLink?: Boolean;
}