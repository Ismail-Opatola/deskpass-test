# ...

## Question

Systems like Kubernetes and Docker Swarm are the end result of years and years of effort spent slowly abstracting server resources from being "a single physical machine your app is running on" to "a distributed pool of generic resources any app can run on." What do you think the next level of server abstraction will look like in 10 years? How will web apps be deployed and managed a decade from now? Will container management systems such as Kubernetes still be used, or will there be another layer of abstraction used?

## Answer

I think container management systems, will be quite relevant. However, the future of these systems such as kubernetes is in the custom resource definitions (CRDs) and abstractrions which we build on top of them and make available to users through CRDs. 

Kubernetes may become control plane for abstractions, and it's the CRDs of these abstractions that developers would focus on.

Kubernetes control planes may manage resources inside or even outside kubernetes as crossplane manages cloud infrastructure.

Another possibility is that we may see a shift to a different runtime. Function-as-a-service or Serverless may replace kubernetes as the de facto standard runtime for distributed applications.

FaaS is a great abstraction for managing the deployment. It is a developer friendly abstraction for depoying software.

Although current implementation of FaaS are designed to deal with execution of a single task at a single location, it doesn't yet solve the problems of abstracting of a larger network system.

While the development abstractions may improve, it would be naive to imagine you can entirely abstract away complexities of deploying and operating distributed systems.