function F_gamma = CDF_BX(m, lambda, Omega, alpha, D, g1, n, p, B_l, psi_l, gamma, gamma_bar)

    % First part of the equation
    term1 = (1 / alpha) * exp(-(m * lambda^2) / Omega);
    
    % Summation part of the equation
    summation = 0;
    for l0 = 1:n
        for l = 0:p
            t1 = B_l(l0) * C_function(l, p, m-1);
            term2 = ((m * lambda^2) / Omega)^l;
            
            a1 = 1 - psi_l(l0);
            a2 = 1;
            b1 = [m+l,0];
            b2 = [-psi_l(l0)];
        
            G_value = meijerG(a1, a2, b1, b2, (m*(D^alpha)*gamma/(Omega*g1*gamma_bar)));

            summation = summation + t1*term2*G_value;
        end
    end
    
    F_gamma = term1 * summation;
end
