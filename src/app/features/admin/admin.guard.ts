import { inject } from "@angular/core";
import { CanActivateChildFn, CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { AdminService } from "./admin.service";

export const adminGuard: CanActivateFn & CanActivateChildFn = (
  _route,
  state,
) => {
  const router = inject(Router);
  return inject(AdminService)
    .session()
    .pipe(
      map(() => true),
      catchError(() =>
        of(
          router.createUrlTree(["/admin/login"], {
            queryParams: { returnUrl: state.url },
          }),
        ),
      ),
    );
};
