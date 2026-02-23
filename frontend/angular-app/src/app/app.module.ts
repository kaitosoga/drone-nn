import { LocationStrategy, HashLocationStrategy } from '@angular/common';

providers: [
  { provide: LocationStrategy, useClass: HashLocationStrategy }
]
