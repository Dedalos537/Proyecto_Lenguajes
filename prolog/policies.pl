% filepath: /home/diego/Documents/Proyecto_Lenguajes/prolog/policies.pl
cookie_type(essential, false).
cookie_type(analytics, true).
cookie_type(marketing, true).
cookie_type(performance, true).

can_set_cookie(CookieType, ConsentGivenForType) :-
    cookie_type(CookieType, RequiresConsent),
    (
        (RequiresConsent = false)
        ;
        (RequiresConsent = true, ConsentGivenForType = true)
    ).

requires_consent(CookieType, Requires) :-
    cookie_type(CookieType, Requires).

classify_cookie(Name, Type) :-
    member(Name, ['session_id', 'csrf_token']),
    Type = essential.
classify_cookie(Name, Type) :-
    member(Name, ['_ga', '_utm']),
    Type = analytics.
classify_cookie(Name, Type) :-
    member(Name, ['ad_id', 'fb_pixel']),
    Type = marketing.
classify_cookie(_, unknown).