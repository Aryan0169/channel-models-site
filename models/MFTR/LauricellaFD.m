function FD = LauricellaFD(a, b, c, x)
    % a: Scalar parameter 'a'
    % b: Vector of parameters [b1, b2, b3, b4]
    % c: Scalar parameter 'c'
    % x: Vector of variables [x1, x2, x3, x4]
    % N: Number of terms for the inverse Laplace transform (same as in Phi2)
    % FD: Output value of the Lauricella function F_D^{(4)}


    p1 = gamma(c)/(gamma(a)*gamma(c - a));
    
    % Define the integrand as a function handle
    integrand = @(t) t.^(a-1) .* (1-t).^(c-a-1) .* (1 - x(1).*t).^-b(1) ...
                     .* (1 - x(2).*t).^-b(2) .* (1 - x(3).*t).^-b(3) ...
                     .* (1 - x(4).*t).^-b(4);
    
    % Perform the numerical integration
    result = integral(integrand, 0, 1);
    
    % Display the result
    FD = p1*result;

    % end
end
