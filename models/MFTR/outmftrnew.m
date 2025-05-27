function result = outmftrnew(K, m, mu, g, D, x)

omega=g;

a1=m*mu*(1+K)/(m+mu*K)/omega;
a2=m*mu*(1+K)/(m+mu*K*(1+D))/omega;
a3=m*mu*(1+K)/(m+mu*K*(1-D))/omega;
a4=mu*(1+K)/omega;

OP=0;

for q=0:floor((m-1)/2)
    
   delta=-[a1 a2 a3 a4];
   beta=[1+2*q-m m-q-1/2 m-q-1/2 mu-m];
   
   
   C=gamma(1+2*(m-1)-2*q)/gamma(1+q)/gamma(1+m-1-q)/gamma(1+m-1-2*q);
    
   CDF_TERM=(-1)^q*((a2*a3)^(0.5)/a1)^(m-1-2*q)*C*...
       (1/gamma(mu+1)).*(x).^((mu)).*Phi2(x,mu+1,delta,beta,1e4);
      
    
   OP=OP+CDF_TERM; 
end
OP=((a2*a3)^(m/2))/(2^(m-1)*(a4)^(m-mu))*OP;
result = OP;