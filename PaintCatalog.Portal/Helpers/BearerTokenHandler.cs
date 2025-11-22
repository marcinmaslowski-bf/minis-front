using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace PaintCatalog.Portal.Helpers
{
    public class BearerTokenHandler : DelegatingHandler
    {
        private readonly IAccessTokenProvider _accessTokenProvider;

        public BearerTokenHandler(IAccessTokenProvider accessTokenProvider)
        {
            _accessTokenProvider = accessTokenProvider;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var accessToken = await _accessTokenProvider.GetAccessTokenAsync();

            if (!string.IsNullOrEmpty(accessToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            }

            return await base.SendAsync(request, cancellationToken);
        }
    }
}
