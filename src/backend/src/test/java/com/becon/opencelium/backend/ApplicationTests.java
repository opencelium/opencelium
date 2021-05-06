/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
public class ApplicationTests {

	@Test
	public void contextLoads() {
		try	{

//			FileRepositoryBuilder builder = new FileRepositoryBuilder();
//			Repository repository = builder
//					.readEnvironment() // scan environment GIT_* variables
//					.findGitDir()// scan up the file system tree
//					.build();
//			Git git = new Git(repository);
//			git.checkout().setName().call();
//			System.out.println(repository.toString());
//			System.out.println(git.tag().getMessage());
//			ListTagCommand listTagCommand = git.tagList();
//			TagCommand tagCommand = git.tag();
//			System.out.println(git.tag().getName());
//			RevWalk revCommits = new RevWalk(repository);
//			System.out.println(git.tag().getName());
//			List<Ref> list = git.tagList().call();
//			Ref peeledRefs = repository.findRef("refs/tags/v1.3.2");
//			for (Ref ref : list) {
//				System.out.println("Tag: " + ref + " " + ref.getName() + " " + ref.getObjectId().getName());
//
//				// fetch all commits for this tag
//				LogCommand log = git.log();
//
//				Ref peeledRef = repository.peel(ref);
//				if(peeledRef.getPeeledObjectId() != null) {
//					// Annotated tag
//					log.add(peeledRef.getPeeledObjectId());
//				} else {
//					// Lightweight tag
//					log.add(ref.getObjectId());
//				}
//			}
//			System.out.println("hhh");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
