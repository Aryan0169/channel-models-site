function C_value = C_function(l, p, nu)

    % Calculate the terms in the equation for C(l, p, nu)
    numerator = gamma(p + l) * p^(1 - 2*l);  % Gamma(p+l) * p^(1-2l)
    denominator = gamma(l + 1) * gamma(p - l + 1) * gamma(nu + l + 1);  % Gamma(l+1) * Gamma(p-l+1) * Gamma(nu+l+1)

    % The final value of C(l, p, nu)
    C_value = numerator / denominator;

end
