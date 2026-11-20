package io.opencelium.core.tenant;

import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterProperties;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

/**
 * Runs each request for its tenant: the rest of the filter chain and the handler run through the tenant runner. The
 * filter comes right after the security filter chain, so that the login of the request is known.
 * <ul>
 * <li>self-host: each request runs for {@link TenantId#SELF_HOST}, with or without a login. The installation has 1
 * tenant, so the filter does not read the principal.</li>
 * <li>cloud: a request with a login runs for the tenant that its principal names ({@link TenantPrincipal}). A request
 * without a login runs without a tenant, and each use of a tenant document in it stops. A principal that names a
 * reserved tenant stops the request with the refusal of the tenant runner.</li>
 * </ul>
 * The filter reads no header, no parameter and no body: a client could name each tenant there.
 */
@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
final class TenantRequestFilter extends OncePerRequestFilter implements Ordered {

	private final TenantRunner tenantRunner;

	private final DeploymentMode mode;

	private final int order;

	TenantRequestFilter(TenantRunner tenantRunner, OpenCeliumProperties properties,
			SecurityFilterProperties securityFilter) {
		this.tenantRunner = tenantRunner;
		this.mode = properties.deploymentMode();
		this.order = securityFilter.getOrder() + 1;
	}

	@Override
	public int getOrder() {
		return order;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		Optional<TenantId> tenant = switch (mode) {
			case SELF_HOST -> Optional.of(TenantId.SELF_HOST);
			case CLOUD -> TenantPrincipal.tenantOf(request.getUserPrincipal());
		};
		if (tenant.isEmpty()) {
			chain.doFilter(request, response);
			return;
		}
		// The tenant runner takes a task without checked exceptions; those of the chain leave the filter unchanged.
		var checked = new AtomicReference<Exception>();
		tenantRunner.run(tenant.get(), () -> {
			try {
				chain.doFilter(request, response);
			}
			catch (IOException | ServletException ex) {
				checked.set(ex);
			}
		});
		if (checked.get() instanceof IOException ex) {
			throw ex;
		}
		if (checked.get() instanceof ServletException ex) {
			throw ex;
		}
	}

}
