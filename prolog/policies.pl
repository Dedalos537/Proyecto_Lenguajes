% policies.pl

% Hechos: Tipos de cookies y si requieren consentimiento
cookie_type(essential, false).
cookie_type(analytics, true).
cookie_type(marketing, true).
cookie_type(performance, true).

% Reglas:
% Puede establecer una cookie si:
% 1. Es esencial y no requiere consentimiento.
% 2. Requiere consentimiento y el usuario lo ha otorgado para ese tipo.

can_set_cookie(CookieType, ConsentGivenForType) :-
    cookie_type(CookieType, RequiresConsent),
    (
        (RequiresConsent = false)
        ;
        (RequiresConsent = true, ConsentGivenForType = true)
    ).

% Predicado para determinar el consentimiento requerido para un tipo de cookie
requires_consent(CookieType, Requires) :-
    cookie_type(CookieType, Requires).

% Predicado para clasificar una cookie (ejemplo simple)
classify_cookie(Name, Type) :-
    member(Name, ['session_id', 'csrf_token']), % <-- Aquí se añaden las comillas
    Type = essential.
classify_cookie(Name, Type) :-
    member(Name, ['_ga', '_utm']),             % <-- ¡Aquí está la corrección clave!
    Type = analytics.
classify_cookie(Name, Type) :-
    member(Name, ['ad_id', 'fb_pixel']),      % <-- Aquí también
    Type = marketing.
classify_cookie(_, unknown). % Por defecto si no se clasifica