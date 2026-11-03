import type { ValidationError } from '@angular/forms/signals';

import type { SearchError, TranslatableMessage } from './home.types';

export function isSearchError(
  _error: ValidationError.WithOptionalFieldTree,
): _error is SearchError {
  throw new Error('not implemented');
}

export function searchErrorMessage(_error: SearchError): TranslatableMessage {
  throw new Error('not implemented');
}
