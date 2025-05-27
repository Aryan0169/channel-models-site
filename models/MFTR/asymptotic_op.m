% function P_out = asymptotic_op(mu, K, m, gamma_bar, Delta)
% 
%     % Hypergeometric function argument
%     hyper_arg = (2 * Delta * K * mu) / (K * mu * (1 - Delta) + m);
% 
%     % Evaluate the hypergeometric function
%     hyper_term_n = gamma(1)*meijerG([0.5, 0.5-m], [], [0], [0], -hyper_arg);
%     hyper_term_d = gamma(0.5)*gamma(m);
%     prod = hyper_term_n/hyper_term_d;
%     % Compute P_out
%     % P_out = (num / den) * hyper_term;
% 
%     numerator = (mu^(mu-1))*((1+K)^mu)*(m^m);
%     denominator = gamma(mu)*(gamma_bar^mu)*((m - (Delta-1)*K*mu)^m);
%     prod2 = numerator/denominator;
%     P_out = prod*prod2;
% end


function P_out = asymptotic_op(mu, K, m, gamma_bar, Delta)
    % Constants and intermediate calculations
    Gamma_mu = gamma(mu); % Gamma function
    threshold = 1; % Calculate 2^R_th - 1

    % Numerator
    num = mu^(mu - 1) * (1 + K)^mu * m^m * threshold^mu;

    % Denominator
    den = Gamma_mu*(gamma_bar^mu);


    alpha = m / (mu * K);
    
    % Step 2: Compute the prefactor
    prefactor = (mu * K)^(-m) * (1 + alpha - Delta)^(-m);
    
    % Step 3: Compute the argument for hypergeometric function
    z = 2 * Delta / (Delta - 1 - alpha);
    
    % Step 4: Compute the hypergeometric function 2F1
    hypergeom_value = hypergeom([1/2, m], 1, z);
    
    % Step 5: Combine prefactor and hypergeometric value
    I3 = prefactor * hypergeom_value;

    % Compute P_out
    P_out = (num / den) * I3;
end