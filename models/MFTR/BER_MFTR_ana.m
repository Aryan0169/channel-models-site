clc; clear all

K = 10;
mu = 1;
Delta = 0;
m = 2;

snr_db=0:20;
beta = 2;
alpha = 1;

for i = 1:length(snr_db)
    ber(i) = MFTR_ber(K, mu, Delta, m, snr_db(i), beta, alpha);
end
semilogy(snr_db, ber);