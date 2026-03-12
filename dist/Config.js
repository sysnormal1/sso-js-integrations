import { hasValue } from "@aalencarv/common-utils";
let configs = {
    ssoProtocol: 'http',
    ssoAddress: 'localhost',
    ssoPort: null,
    ssoUrl: 'http://localhost',
    ssoRegisterEndpoint: "/auth/register",
    ssoLoginEndpoint: "/auth/login",
    ssoAuthEndpoint: "/auth/login",
    ssoRefreshTokenEndpoint: "/auth/refresh_token",
    ssoGetAllowedsResourcesEndpoint: "/records/resources/get_alloweds",
    ssoRecordsEndpoint: "/records",
    ssoSystemsEndpoint: "/records/systems",
    ssoAccessProfilesEndpoint: "/records/access_profiles",
    ssoAgentsXAccessProfilesXSystemsEndpoint: "/records/agents_x_access_profiles_x_systems",
    ssoResourcesEndpoint: "/records/resources",
    ssoResourcePermissionsEndpoint: "/records/resource_permissions",
    ssoGetResourcePermissionsEndpoint: "/records/resources/get_resource_permissions",
    ssoThisSystemId: null,
    ssoResourcetypeScreenId: 10,
    showResourceAsPopup: false
};
export function config(params) {
    configs = { ...configs, ...params };
    if (hasValue(params?.ssoPort) && !hasValue(params?.ssoUrl)) {
        configs.ssoUrl = (configs.ssoUrl || '') + `:${params.ssoPort}`;
    }
    Object.freeze(configs);
}
export function getConfigs() {
    let result = { ...configs };
    Object.freeze(result);
    return result; //avoid change
}
