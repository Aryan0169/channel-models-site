function result = MFTR_ber(K, mu, Delta, m, snr_db, beta, alpha)
    omega=10^(snr_db/10);
    gamma_bar = omega;
    
    q1 = (((1+K)*mu)^mu)/((2^(m-1))*gamma(mu+1)*(gamma_bar^mu));
    q2 = m/sqrt((m+mu*K)^2 - (mu*K*Delta)^2);
    
    d = [-2*(1 + K)*m*mu / (beta * (m + mu*K)*gamma_bar), ...
         -2*(1 + K)*m*mu / (beta * (m + mu*K*(1 + Delta))*gamma_bar), ...
         -2*(1 + K)*m*mu / (beta * (m + mu*K*(1 - Delta))*gamma_bar), ...
         -2*(1 + K)*mu / (beta*gamma_bar)];
    
    OP=0;

    for q=0:floor((m-1)/2)
       a = mu + 0.5;
       b = [1 + 2*q - m, m - q - 0.5, m - q - 0.5, mu - m];
       c = mu + 1;
    
       PD = alpha*(2^(mu - 1))*gamma(mu + 0.5)*LauricellaFD(a, b, c, d)/((beta^mu)*sqrt(pi));
       CDF_TERM=((-1)^q)*nchoosek(m-1, q)*nchoosek(2*(m-1)-2*q, m-1)*(((m+mu*K)/sqrt((m+mu*K)^2 - (mu*K*Delta)^2))^(m-1-2*q))*PD;
        
       OP=OP+CDF_TERM; 
    end
    OP = OP*q1*(q2^m);
result = OP;
% semilogy(snr_db,OP)
% hold on