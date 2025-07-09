% policies.pl

% Hechos: Tipos de cookies y si requieren consentimiento
cookie_type(essential, false). [cite: 1]
cookie_type(analytics, true). [cite: 1]
cookie_type(marketing, true). [cite: 1]
cookie_type(performance, true). [cite: 1]

% Reglas: [cite: 2]
% Puede establecer una cookie si:
% 1. Es esencial y no requiere consentimiento. [cite: 2]
% 2. Requiere consentimiento y el usuario lo ha otorgado para ese tipo. [cite: 3]
can_set_cookie(CookieType, ConsentGivenForType) :- [cite: 4]
    cookie_type(CookieType, RequiresConsent), [cite: 4]
    (
        (RequiresConsent = false) % Essential cookies [cite: 4]
        ;
        (RequiresConsent = true, ConsentGivenForType = true) % Other cookies with consent [cite: 4]
    ).

% Predicado para determinar el consentimiento requerido para un tipo de cookie
requires_consent(CookieType, Requires) :- [cite: 5]
    cookie_type(CookieType, Requires). [cite: 5]

% Predicado para clasificar una cookie (ejemplo simple)
classify_cookie(Name, Type) :- [cite: 6]
    member(Name, ['session_id', 'csrf_token']), % <-- Aquí se añaden las comillas [cite: 6]
    Type = essential. [cite: 6]
classify_cookie(Name, Type) :- [cite: 7]
    member(Name, ['_ga', '_utm']),             % <-- ¡Aquí está la corrección clave! [cite: 7]
    Type = analytics. [cite: 8]
classify_cookie(Name, Type) :- [cite: 8]
    member(Name, ['ad_id', 'fb_pixel']),      % <-- Aquí también [cite: 8]
    Type = marketing. [cite: 8]
classify_cookie(_, unknown). % Por defecto si no se clasifica [cite: 9]