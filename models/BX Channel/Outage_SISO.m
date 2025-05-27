clc; close all; clear all;

m = 2.6;
lambda = 1.5;
Omega = 1;
alpha = 2;
D = 50; %radius
n = 3;
p = 10;
B_l = [735, -1190, 455]/72;
beta_l = [2, 4, 6];
psi_l = (beta_l+1)/alpha;
Gv = 10^(5.5);
Gr = 10^(5.5);
w = 3*1e8/(300*1e9);
g1 = Gv*Gr*(w/(4*pi))^2;
gamma = 1;

snr_db = 0:30;
snr_lin = 10.^(snr_db/10);

for i = 1:length(snr_db)
    out(i) = CDF_BX(m, lambda, Omega, alpha, D, g1, n, p, B_l, psi_l, snr_lin(i), gamma)
end

semilogy(snr_db, out);